// AI 服务模块 - DashScope/通义千问 接入 + 本地 fallback
use serde::{Deserialize, Serialize};
use reqwest::Client;

#[derive(Serialize)]
struct DashScopeRequest {
    model: String,
    input: InputData,
    parameters: Parameters,
}

#[derive(Serialize)]
struct InputData {
    messages: Vec<ChatMessage>,
}

#[derive(Serialize, Clone)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct Parameters {
    result_format: String,
    max_tokens: usize,
    temperature: f32,
    top_p: f32,
    incremental_output: bool,
}

#[derive(Deserialize)]
struct DashScopeResponse {
    output: OutputData,
}

#[derive(Deserialize)]
struct OutputData {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: ResponseMessage,
}

#[derive(Deserialize)]
struct ResponseMessage {
    content: String,
}

/// 系统提示词 - 医疗AI助手角色
const SYSTEM_PROMPT: &str = r#"你是一位专业的住院医生AI助手，名叫"小医"。你的职责是：
1. 协助住院医生进行临床决策
2. 分析患者检验数据、影像报告
3. 提供诊疗建议和用药参考
4. 生成规范的医疗文书（病历、医嘱、交班摘要等）

注意事项：
- 回答要专业、简洁、有条理
- 涉及关键发现时用"关键发现"和"建议"的结构化格式
- 危急值要明确警告
- 所有建议仅供参考，最终决策由医生做出
- 使用中文回答"#;

pub struct AIService {
    client: Client,
    api_key: String,
}

impl AIService {
    pub fn new() -> Self {
        let api_key = std::env::var("DASHSCOPE_API_KEY")
            .unwrap_or_else(|_| String::new());
        Self {
            client: Client::new(),
            api_key,
        }
    }

    pub fn new_with_key(api_key: String) -> Self {
        Self {
            client: Client::new(),
            api_key,
        }
    }

    /// 判断是否有有效的 API key
    fn has_api_key(&self) -> bool {
        !self.api_key.is_empty() && self.api_key != "sk-placeholder"
    }

    /// 核心聊天方法
    pub async fn chat(
        &self,
        patient_context: &str,
        user_message: &str,
        history: Vec<(String, String)>,
    ) -> Result<String, String> {
        if !self.has_api_key() {
            return Ok(self.fallback_chat(patient_context, user_message));
        }

        let mut messages = vec![ChatMessage {
            role: "system".to_string(),
            content: format!(
                "{}\n\n当前患者信息：\n{}",
                SYSTEM_PROMPT, patient_context
            ),
        }];

        for (role, content) in history.iter().rev().take(10).rev() {
            messages.push(ChatMessage {
                role: role.clone(),
                content: content.clone(),
            });
        }

        messages.push(ChatMessage {
            role: "user".to_string(),
            content: user_message.to_string(),
        });

        let request = DashScopeRequest {
            model: "qwen-plus".to_string(),
            input: InputData { messages },
            parameters: Parameters {
                result_format: "message".to_string(),
                max_tokens: 2000,
                temperature: 0.7,
                top_p: 0.9,
                incremental_output: false,
            },
        };

        let response = self
            .client
            .post("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("API request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            eprintln!("DashScope API error {}: {}", status, body);
            return Ok(self.fallback_chat(patient_context, user_message));
        }

        let body: DashScopeResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        if body.output.choices.is_empty() {
            return Ok(self.fallback_chat(patient_context, user_message));
        }

        let raw = &body.output.choices[0].message.content;
        Ok(format_ai_response(raw))
    }

    /// 生成病历
    pub async fn generate_medical_record(
        &self,
        patient_info: &str,
        conversation: &str,
    ) -> Result<String, String> {
        if !self.has_api_key() {
            return Ok(self.fallback_medical_record(patient_info));
        }
        let prompt = format!(
            "请根据以下患者信息和对话记录，生成一份完整的入院病历：\n\n患者信息：\n{}\n\n对话记录：\n{}\n\n请按照以下格式生成：主诉、现病史、既往史、体格检查、辅助检查、初步诊断、诊疗计划",
            patient_info, conversation
        );
        self.chat(patient_info, &prompt, vec![]).await
    }

    /// 生成开单建议
    pub async fn generate_orders(&self, patient_info: &str) -> Result<String, String> {
        if !self.has_api_key() {
            return Ok(self.fallback_orders());
        }
        let prompt = format!(
            "请根据以下患者信息，生成检查项目和药品处方建议：\n\n{}\n\n请分别列出：\n1. 检查项目（名称+目的）\n2. 药品处方（药名+剂量+频次+用途）",
            patient_info
        );
        self.chat(patient_info, &prompt, vec![]).await
    }

    /// 生成会诊意见
    pub async fn generate_consult(&self, patient_info: &str) -> Result<String, String> {
        if !self.has_api_key() {
            return Ok(self.fallback_consult());
        }
        let prompt = format!(
            "请根据以下患者信息，模拟多学科联合会诊，给出至少3个科室的会诊意见：\n\n{}\n\n每个科室请说明：科室名称、会诊意见、注意事项",
            patient_info
        );
        self.chat(patient_info, &prompt, vec![]).await
    }

    /// 生成交班摘要
    pub async fn generate_handover(
        &self,
        patient_info: &str,
        conversation: &str,
    ) -> Result<String, String> {
        if !self.has_api_key() {
            return Ok(self.fallback_handover(patient_info));
        }
        let prompt = format!(
            "请根据以下信息生成交班摘要：\n\n患者信息：\n{}\n\n今日对话记录：\n{}\n\n格式：患者基本情况、今日病情变化、重要检查结果、待处理事项、注意事项",
            patient_info, conversation
        );
        self.chat(patient_info, &prompt, vec![]).await
    }

    /// DRG 分析
    pub async fn generate_drg(&self, patient_info: &str) -> Result<String, String> {
        if !self.has_api_key() {
            return Ok(self.fallback_drg());
        }
        let prompt = format!(
            "请根据以下患者信息进行 DRG/DIP 分析：\n\n{}\n\n请提供：DRG分组、权重、预计费用、当前费用评估、费用控制建议",
            patient_info
        );
        self.chat(patient_info, &prompt, vec![]).await
    }

    // ==================== Fallback 模拟回复 ====================

    fn fallback_chat(&self, _patient_context: &str, user_message: &str) -> String {
        let analysis = if user_message.contains("感染") || user_message.contains("抗生素") {
            r#"<div class="ai-conclusion">感染相关分析：</div>
<div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">
• WBC 及 CRP 变化趋势需密切关注<br>
• 当前抗感染方案覆盖常见病原菌<br>
• 建议 48-72h 评估抗感染疗效
</div></div>
<div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">
① 复查血常规 + CRP + PCT<br>
② 必要时行血培养 + 药敏试验<br>
③ 根据培养结果调整抗生素方案
</div></div>"#
        } else if user_message.contains("血压") || user_message.contains("循环") {
            r#"<div class="ai-conclusion">循环系统分析：</div>
<div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">
• 血压控制目标需个体化<br>
• 关注液体平衡及心功能状态<br>
• 注意药物相互作用
</div></div>
<div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">
① 持续血压监测，目标 SBP 120-140mmHg<br>
② 评估容量状态，调整输液速度<br>
③ 必要时请心内科会诊
</div></div>"#
        } else {
            r#"<div class="ai-conclusion">根据患者当前情况分析：</div>
<div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">
• 患者症状与诊断相符<br>
• 需关注实验室检查变化趋势<br>
• 当前治疗方案需根据最新检查结果调整
</div></div>
<div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">
① 密切监测生命体征变化<br>
② 完善相关辅助检查<br>
③ 根据检查结果调整治疗方案<br>
④ 注意药物不良反应监测
</div></div>"#
        };

        format!(
            "{}\n<div class=\"ai-risk\">⚠️ 注意：此为AI辅助分析（离线模式），临床决策请结合患者实际情况。<br>💡 设置 DASHSCOPE_API_KEY 环境变量可启用通义千问实时分析。</div>",
            analysis
        )
    }

    fn fallback_medical_record(&self, patient_info: &str) -> String {
        format!(
            "<h2>入院病历</h2>\
<p><strong>主诉：</strong>根据患者信息自动生成</p>\
<p><strong>现病史：</strong>患者因相关症状入院，目前病情稳定。</p>\
<p><strong>既往史：</strong>详见患者基本信息。</p>\
<p><strong>体格检查：</strong>神清，精神可，生命体征平稳。</p>\
<p><strong>辅助检查：</strong>详见检验/影像报告。</p>\
<p><strong>初步诊断：</strong>{}</p>\
<p><strong>诊疗计划：</strong></p>\
<ol><li>完善入院常规检查</li><li>对症支持治疗</li><li>监测病情变化</li><li>必要时多学科会诊</li></ol>",
            patient_info
        )
    }

    fn fallback_orders(&self) -> String {
        r#"<div class="ai-section"><div class="ai-section-title">检查项目</div><div class="ai-section-content">
1. 血常规 + CRP — 评估感染指标<br>
2. 肝肾功能 + 电解质 — 评估脏器功能<br>
3. 凝血功能 — 评估出血风险<br>
4. 胸片/CT — 评估肺部情况
</div></div>
<div class="ai-section"><div class="ai-section-title">药品处方</div><div class="ai-section-content">
1. 头孢曲松钠 2g IV qd — 抗感染<br>
2. 0.9%氯化钠 500ml IV drip — 补液<br>
3. 奥美拉唑 40mg IV qd — 护胃<br>
4. 低分子肝素 4000U SC qd — 预防血栓
</div></div>"#
            .to_string()
    }

    fn fallback_consult(&self) -> String {
        r#"<div class="ai-section"><div class="ai-section-title">🫁 呼吸内科</div><div class="ai-section-content">
会诊意见：患者肺部感染诊断明确，建议加强抗感染治疗，必要时行支气管镜检查。<br>
注意事项：监测氧合指数，警惕呼吸衰竭。
</div></div>
<div class="ai-section"><div class="ai-section-title">❤️ 心内科</div><div class="ai-section-content">
会诊意见：患者心功能尚可，但需注意液体负荷，建议控制输液速度。<br>
注意事项：监测BNP及心电图变化。
</div></div>
<div class="ai-section"><div class="ai-section-title">🧪 临床药学</div><div class="ai-section-content">
会诊意见：当前用药方案合理，注意药物相互作用及肝肾功能调整。<br>
注意事项：监测血药浓度，必要时调整剂量。
</div></div>"#
            .to_string()
    }

    fn fallback_handover(&self, patient_info: &str) -> String {
        format!(
            "<div class=\"ai-section\"><div class=\"ai-section-title\">患者基本情况</div><div class=\"ai-section-content\">{}</div></div>\
<div class=\"ai-section\"><div class=\"ai-section-title\">今日病情变化</div><div class=\"ai-section-content\">\
• 病情总体稳定，生命体征平稳<br>• 主要症状有所改善<br>• 暂无新增不适主诉\
</div></div>\
<div class=\"ai-section\"><div class=\"ai-section-title\">重要检查结果</div><div class=\"ai-section-content\">\
• 血常规：WBC 趋势需关注<br>• 生化指标：基本正常\
</div></div>\
<div class=\"ai-section\"><div class=\"ai-section-title\">待处理事项</div><div class=\"ai-section-content\">\
① 明日复查血常规 + CRP<br>② 根据培养结果调整抗生素<br>③ 评估是否可降级护理\
</div></div>\
<div class=\"ai-section\"><div class=\"ai-section-title\">注意事项</div><div class=\"ai-section-content\">\
⚠️ 夜间注意观察呼吸情况及体温变化\
</div></div>",
            patient_info
        )
    }

    fn fallback_drg(&self) -> String {
        r#"<div class="ai-section"><div class="ai-section-title">DRG 分组</div><div class="ai-section-content">
• DRG分组：ES1（呼吸系统感染）<br>
• 权重：1.2345<br>
• 预计费用：¥25,000
</div></div>
<div class="ai-section"><div class="ai-section-title">费用评估</div><div class="ai-section-content">
• 已用费用：¥18,500 (74%)<br>
• 剩余额度：¥6,500<br>
• 超支风险：中等
</div></div>
<div class="ai-section"><div class="ai-section-title">费用控制建议</div><div class="ai-section-content">
① 优先使用医保目录内药品<br>
② 减少不必要的检查项目<br>
③ 评估出院指征，合理缩短住院日
</div></div>"#
            .to_string()
    }
}

/// 将纯文本 AI 回复格式化为结构化 HTML
fn format_ai_response(raw: &str) -> String {
    // 如果已经包含 HTML 标签，直接返回
    if raw.contains("<div") || raw.contains("<strong") {
        return raw.to_string();
    }

    // 简单包装为 HTML
    let paragraphs: Vec<&str> = raw.split("\n\n").collect();
    if paragraphs.len() > 1 {
        let mut html = String::new();
        for p in paragraphs {
            let trimmed = p.trim();
            if !trimmed.is_empty() {
                html.push_str(&format!("<p>{}</p>", trimmed.replace('\n', "<br>")));
            }
        }
        html
    } else {
        format!("<p>{}</p>", raw.replace('\n', "<br>"))
    }
}
