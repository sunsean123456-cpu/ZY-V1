import { useState, useRef, useEffect } from 'react';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  references?: { title: string; journal: string; year: string; doi?: string; url?: string }[];
  attachmentType?: 'image' | 'file' | 'doc' | 'ppt' | 'video';
  attachmentName?: string;
  downloadable?: { filename: string; content: string; type: string };
}

interface SkillConfig {
  id: string;
  icon: string;
  label: string;
  description: string;
}

const SKILLS: SkillConfig[] = [
  { id: 'deep-think', icon: '◉', label: '深度思考', description: '启用多源交叉验证与证据等级评估' },
  { id: 'doc-gen', icon: '▤', label: '生成文档', description: '生成Word格式医学文档' },
  { id: 'ppt-gen', icon: '▦', label: '生成PPT', description: '生成PPT演示文稿' },
  { id: 'ppt-speak', icon: '♫', label: 'PPT Speak', description: '为PPT生成演讲备注' },
];

const DEMO_REFERENCES = [
  { title: 'Effect of SGLT2 Inhibitors on Cardiovascular Outcomes in Heart Failure', journal: 'New England Journal of Medicine', year: '2024', doi: '10.1056/NEJMoa2314290', url: 'https://doi.org/10.1056/NEJMoa2314290' },
  { title: '2024 ESC Guidelines for Heart Failure Management', journal: 'European Heart Journal', year: '2024', doi: '10.1093/eurheartj/ehae178', url: 'https://doi.org/10.1093/eurheartj/ehae178' },
  { title: 'GLP-1 Receptor Agonists in Type 2 Diabetes: A Systematic Review', journal: 'The Lancet Diabetes & Endocrinology', year: '2024', doi: '10.1016/S2213-8587(24)00115-9', url: 'https://doi.org/10.1016/S2213-8587(24)00115-9' },
  { title: 'AI-Assisted Diagnosis in Clinical Practice: Accuracy and Outcomes', journal: 'JAMA', year: '2025', doi: '10.1001/jama.2025.1234', url: 'https://doi.org/10.1001/jama.2025.1234' },
];

export default function GeneralAssistant() {
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([{
    id: 'welcome',
    role: 'assistant',
    content: '您好。我是查查鱼循证医学AI助手，可为您提供基于最新文献的专业医学咨询。\n\n支持多模态输入（文字、图片、文档），以及文档/PPT生成和演讲辅助。\n\n请直接提问，或上传相关资料开始对话。',
    timestamp: new Date().toTimeString().slice(0, 5),
  }]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [skillForm, setSkillForm] = useState<{ topic: string; format: string; extra: string }>({ topic: '', format: 'docx', extra: '' });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs.length]);

  const toggleSkill = (id: string) => {
    if (id === 'deep-think') {
      setDeepThink(!deepThink);
      return;
    }
    if (activeSkill === id) {
      setActiveSkill(null);
      setSkillForm({ topic: '', format: 'docx', extra: '' });
    } else {
      setActiveSkill(id);
      setSkillForm({ topic: '', format: id === 'doc-gen' ? 'docx' : id === 'ppt-gen' ? 'pptx' : 'txt', extra: '' });
    }
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.txt';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const isImage = file.type.startsWith('image/');
      const isPPT = file.name.endsWith('.pptx') || file.name.endsWith('.ppt');
      const isDoc = file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.name.endsWith('.pdf');
      const attachmentType = isImage ? 'image' : isPPT ? 'ppt' : isDoc ? 'doc' : 'file';
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 5);
      setChatMsgs(prev => [...prev, {
        id: `file_${Date.now()}`,
        role: 'user',
        content: `已上传文件：${file.name}（${(file.size / 1024).toFixed(1)} KB）`,
        timestamp: timeStr,
        attachmentType,
        attachmentName: file.name,
      }]);
      // Auto trigger AI analysis
      setTimeout(() => {
        setIsLoading(true);
        setTimeout(() => {
          const t2 = new Date().toTimeString().slice(0, 5);
          setChatMsgs(prev => [...prev, {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: `已分析您上传的文件 **${file.name}**。\n\n**文件概要**\n- 文件类型：${attachmentType === 'image' ? '图片' : attachmentType === 'ppt' ? '演示文稿' : attachmentType === 'doc' ? '文档' : '其他'}\n- 文件大小：${(file.size / 1024).toFixed(1)} KB\n\n**建议**\n请告诉我您希望如何处理这份文件，例如：\n- 提取关键信息并生成摘要\n- 基于文件内容生成新的文档/PPT\n- 对文件内容进行分析和点评`,
            timestamp: t2,
          }]);
          setIsLoading(false);
        }, 1200);
      }, 300);
    };
    input.click();
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const now = new Date();
        const timeStr = now.toTimeString().slice(0, 5);
        setChatMsgs(prev => [...prev, {
          id: `img_${Date.now()}`,
          role: 'user',
          content: `已上传图片：${file.name}`,
          timestamp: timeStr,
          attachmentType: 'image',
          attachmentName: file.name,
        }]);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type: type + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateDocContent = (topic: string) => {
    return `${topic}

一、概述
${topic}是当前医学领域的重要研究方向。本文基于最新循证医学证据，对该主题进行系统梳理。

二、背景与现状
根据最新的流行病学数据，该领域的发病率和治疗需求呈现以下趋势：
1. 发病率逐年上升，尤其在老龄化社会中更为显著
2. 诊断技术不断进步，早期检出率提高
3. 治疗方案日益多样化，个体化治疗成为趋势

三、诊断标准
基于2024年最新指南推荐：
- 主要诊断依据：临床表现 + 辅助检查
- 辅助检查：实验室检查、影像学检查
- 鉴别诊断：需排除相关疾病

四、治疗策略
4.1 一线治疗方案
根据多项RCT研究结果，推荐以下一线治疗方案：
- 药物治疗：基于循证证据A级推荐
- 非药物干预：生活方式调整、康复训练

4.2 二线及补救治疗
当一线治疗效果不佳时，可考虑：
- 联合用药方案
- 新型治疗手段

五、预后与随访
- 短期预后：多数患者可获得良好改善
- 长期管理：需要定期随访和监测
- 生活质量评估：建议使用标准化量表

六、总结
${topic}的诊疗需要多学科协作，基于最新循证证据制定个体化方案。建议临床医生持续关注该领域的最新进展。

参考文献
[1] 相关领域最新Meta分析, Journal of Clinical Medicine, 2024
[2] 最新诊疗指南, European Heart Journal, 2024
[3] 治疗策略专家共识, The Lancet, 2025

---
本文档由查查鱼AI助手自动生成
生成时间：${new Date().toLocaleString('zh-CN')}
`;
  };

  const generatePPTContent = (topic: string, slideCount: number) => {
    const slides = [
      { title: topic, subtitle: `基于循证医学的系统分析\n汇报人：___________\n日期：${new Date().toLocaleDateString('zh-CN')}`, notes: '开场白：各位老师好，今天我将为大家汇报关于' + topic + '的最新进展。' },
      { title: '目录', subtitle: '1. 背景与现状\n2. 诊断标准\n3. 治疗策略\n4. 最新研究进展\n5. 总结与展望', notes: '简要介绍汇报结构，预计15-20分钟。' },
      { title: '背景与现状', subtitle: '流行病学数据\n- 全球发病率趋势\n- 高危人群特征\n- 疾病负担分析', notes: '重点强调该疾病的重要性和临床需求，引用WHO最新数据。' },
      { title: '诊断标准更新', subtitle: '2024年最新指南变化\n- 诊断标准演变\n- 新型生物标志物\n- 影像学进展', notes: '对比新旧指南差异，突出关键更新点。' },
      { title: '治疗策略', subtitle: '一线治疗方案\n- 药物选择依据\n- 个体化治疗原则\n- 联合治疗策略', notes: '结合具体病例说明治疗方案选择的临床思维过程。' },
      { title: '最新研究进展', subtitle: '关键RCT研究结果\n- 主要终点数据\n- 亚组分析\n- 安全性数据', notes: '重点解读2-3项关键研究，用数据说话。' },
      { title: '临床实践建议', subtitle: '基于证据的推荐\n- 诊断流程优化\n- 治疗方案选择\n- 随访管理策略', notes: '将研究证据转化为可操作的临床建议。' },
      { title: '总结与展望', subtitle: '核心要点回顾\n- 关键take-home message\n- 未来研究方向\n- 临床转化前景', notes: '总结3-5个核心要点，展望未来发展方向。' },
    ];
    const finalSlides = slides.slice(0, Math.min(slideCount, slides.length));
    let pptText = `演示文稿：${topic}\n共 ${finalSlides.length} 页\n\n`;
    finalSlides.forEach((slide, i) => {
      pptText += `━━━ 第 ${i + 1} 页 ━━━\n标题：${slide.title}\n内容：${slide.subtitle}\n演讲备注：${slide.notes}\n\n`;
    });
    return pptText;
  };

  const generateSpeakNotes = (topic: string) => {
    return `演讲稿：${topic}

【开场】（约2分钟）
各位老师、同事，大家好。我是___，今天非常荣幸能和大家分享关于"${topic}"的最新进展。这个话题在临床实践中越来越受到关注，我将从循证医学的角度，为大家梳理当前的诊疗策略。

【背景介绍】（约3分钟）
首先让我们看一些关键数据。根据最新的流行病学调查显示...
（翻页）这些数字告诉我们，这个疾病的负担不容小觑。特别值得注意的是，在以下人群中风险更高...
（翻页）从卫生经济学角度来看，优化诊疗策略不仅能改善患者预后，还能降低医疗成本。

【诊断标准】（约4分钟）
接下来是诊断部分。2024年的最新指南对诊断标准进行了重要更新...
（翻页）具体来说，新的诊断标准主要包括以下几个方面...
（翻页）在辅助检查方面，有几个新的生物标志物值得关注...

【治疗策略】（约5分钟）
这是今天汇报的重点。基于目前的循证证据，治疗策略可以分为以下几个层次...
（翻页）一线治疗方面，多项RCT研究一致支持...
（翻页）对于一线治疗失败的患者，我们有哪些选择？根据最新研究...
（翻页）特别要强调的是个体化治疗。不同患者群体需要不同的策略...

【研究进展】（约3分钟）
让我们看看最近发表的关键研究...
（翻页）这项发表在NEJM的研究显示...
（翻页）另一项Lancet的研究则提示...

【总结】（约2分钟）
最后，让我总结今天的核心要点：
第一...
第二...
第三...

展望未来，我认为以下几个方向值得关注...

【问答准备】
可能的提问及回答要点：
Q1: 这个治疗方案在特殊人群中的适用性？
A: 根据亚组分析数据...

Q2: 成本效益比如何？
A: 从药物经济学角度...

---
演讲稿由查查鱼AI助手生成
生成时间：${new Date().toLocaleString('zh-CN')}
`;
  };

  const handleSkillSubmit = () => {
    if (!skillForm.topic.trim() || !activeSkill) return;
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const topic = skillForm.topic;

    // User request message
    const skillLabel = SKILLS.find(s => s.id === activeSkill)?.label || '';
    setChatMsgs(prev => [...prev, {
      id: `req_${Date.now()}`,
      role: 'user',
      content: `请帮我${skillLabel}：${topic}${skillForm.extra ? '\n补充要求：' + skillForm.extra : ''}`,
      timestamp: timeStr,
    }]);

    setActiveSkill(null);
    setSkillForm({ topic: '', format: 'docx', extra: '' });
    setIsLoading(true);

    setTimeout(() => {
      const t2 = new Date().toTimeString().slice(0, 5);
      let responseContent = '';
      let downloadable: { filename: string; content: string; type: string } | undefined;

      if (activeSkill === 'doc-gen') {
        const docContent = generateDocContent(topic);
        responseContent = `文档已生成完毕。\n\n**文档概要：${topic}**\n\n文档结构：\n1. 概述\n2. 背景与现状\n3. 诊断标准\n4. 治疗策略（含一线/二线方案）\n5. 预后与随访\n6. 总结\n\n全文约2000字，包含参考文献。\n\n点击下方按钮下载文档 ↓`;
        downloadable = {
          filename: `${topic.replace(/\s+/g, '_')}.doc.txt`,
          content: docContent,
          type: 'text/plain',
        };
      } else if (activeSkill === 'ppt-gen') {
        const slideCount = parseInt(skillForm.extra) || 8;
        const pptContent = generatePPTContent(topic, slideCount);
        responseContent = `PPT已生成完毕。\n\n**演示文稿：${topic}**\n\n共 ${Math.min(slideCount, 8)} 页，结构如下：\n1. 封面\n2. 目录\n3. 背景与现状\n4. 诊断标准更新\n5. 治疗策略\n6. 最新研究进展\n7. 临床实践建议\n8. 总结与展望\n\n每页均包含演讲备注。\n\n点击下方按钮下载PPT内容 ↓`;
        downloadable = {
          filename: `${topic.replace(/\s+/g, '_')}.ppt.txt`,
          content: pptContent,
          type: 'text/plain',
        };
      } else if (activeSkill === 'ppt-speak') {
        const speakContent = generateSpeakNotes(topic);
        responseContent = `演讲稿已生成完毕。\n\n**演讲稿：${topic}**\n\n包含以下部分：\n- 开场白（约2分钟）\n- 背景介绍（约3分钟）\n- 诊断标准（约4分钟）\n- 治疗策略（约5分钟）\n- 研究进展（约3分钟）\n- 总结（约2分钟）\n- 问答准备\n\n总时长约19分钟，含翻页提示。\n\n点击下方按钮下载演讲稿 ↓`;
        downloadable = {
          filename: `${topic.replace(/\s+/g, '_')}_演讲稿.txt`,
          content: speakContent,
          type: 'text/plain',
        };
      }

      setChatMsgs(prev => [...prev, {
        id: `gen_${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: t2,
        downloadable,
        references: activeSkill === 'doc-gen' ? DEMO_REFERENCES.slice(0, 2) : undefined,
      }]);
      setIsLoading(false);
    }, 2000);
  };

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const userMsg: ChatMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputText,
      timestamp: timeStr,
    };
    setChatMsgs(prev => [...prev, userMsg]);
    const query = inputText;
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      const t2 = new Date().toTimeString().slice(0, 5);
      const q = query.toLowerCase();
      let responseContent = '';
      let refs: typeof DEMO_REFERENCES = [];

      if (q.includes('指南') || q.includes('guideline')) {
        responseContent = '根据最新的循证医学证据，2024版ESC心衰指南有以下核心更新：\n\n**1. 药物治疗策略调整**\nSGLT2抑制剂（达格列净、恩格列净）已从二线推荐提升为HFrEF一线治疗，无论是否合并糖尿病。联合ARNI + β受体阻滞剂 + MRA构成"新四联"基础方案。[1]\n\n**2. HFpEF首次获得药物推荐**\n基于EMPEROR-Preserved和DELIVER研究，SGLT2i被推荐用于HFpEF（LVEF>40%），这是该领域首个I类推荐。[2]\n\n**3. 远程监测升级**\n植入式肺动脉压力监测推荐级别提升至IIa类，适用于NYHA III级且既往有心衰住院史的患者。[1]\n\n**4. 铁缺乏管理**\n静脉铁剂补充推荐用于铁缺乏的HFrEF患者，可改善运动耐量和生活质量。[1][3]';
        refs = DEMO_REFERENCES.slice(0, 3);
      } else if (q.includes('药物') || q.includes('drug') || q.includes('相互作用')) {
        responseContent = '**药物信息查询结果**\n\n**达格列净（Dapagliflozin）**\n\n- 适应症：2型糖尿病、HFrEF、慢性肾脏病\n- 推荐剂量：10mg qd\n- 常见不良反应：生殖道感染（5-10%）、容量不足、euglycemic DKA（罕见）\n\n**重要相互作用：**\n- 与利尿剂合用：增加容量不足风险\n- 与胰岛素/磺脲类合用：低血糖风险增加\n\n**临床注意事项：**\n- 术前3天停用\n- eGFR<25时不建议起始治疗';
        refs = [DEMO_REFERENCES[2]];
      } else if (q.includes('ppt') || q.includes('演示') || q.includes('汇报')) {
        responseContent = '我将为您生成PPT。请点击上方 **▦ 生成PPT** 按钮，输入主题和页数要求即可。\n\n生成内容包括：\n- 专业幻灯片结构\n- 每页演讲备注\n- 可直接下载使用';
      } else {
        responseContent = '基于您的问题，以下是我的循证医学分析：\n\n**分析要点**\n\n1. **临床证据评估**\n根据现有高质量RCT和系统评价，最新荟萃分析（纳入12项RCT，N=28,450）显示干预组主要终点风险降低18%（HR 0.82, 95%CI 0.73-0.92, P<0.001）。[1]\n\n2. **安全性考量**\n不良反应谱与既往报道一致，严重不良事件发生率在可接受范围内。[2]\n\n3. **临床建议**\n- 当前方案获益大于风险，建议继续\n- 48-72小时后复查关键指标评估疗效\n- 根据患者个体情况调整辅助用药\n\n**证据等级：** A级（多项RCT一致支持）';
        refs = DEMO_REFERENCES.slice(0, 2);
      }

      if (deepThink) {
        responseContent = '**深度思考模式**\n\n' + responseContent + '\n\n---\n*已启用多源文献交叉验证和证据等级评估*';
      }

      setChatMsgs(prev => [...prev, {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: responseContent,
        timestamp: t2,
        references: refs.length > 0 ? refs : undefined,
      }]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openReference = (ref: { url?: string; title: string }) => {
    if (ref.url) {
      try {
        if ((window as any).__TAURI__) {
          import('@tauri-apps/plugin-shell').then(({ open }) => open(ref.url!));
        } else {
          window.open(ref.url, '_blank');
        }
      } catch {
        window.open(ref.url, '_blank');
      }
    }
  };

  const getSkillFormConfig = (skillId: string) => {
    switch (skillId) {
      case 'doc-gen':
        return { placeholder: '请输入文档主题，如：急性心肌梗死诊疗规范', extraLabel: '补充要求（可选）', extraPlaceholder: '如：重点写药物治疗部分，约3000字', format: 'docx' };
      case 'ppt-gen':
        return { placeholder: '请输入PPT主题，如：糖尿病管理新进展', extraLabel: '页数（默认8页）', extraPlaceholder: '如：10', format: 'pptx' };
      case 'ppt-speak':
        return { placeholder: '请输入演讲主题或已有PPT的主题', extraLabel: '演讲时长（分钟）', extraPlaceholder: '如：15', format: 'txt' };
      default:
        return { placeholder: '', extraLabel: '', extraPlaceholder: '', format: 'txt' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, background: '#fff' }}>
      {/* Header */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid #e5e7eb',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14, fontWeight: 700,
          }}>AI</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>循证医学助手</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Research · Evidence · Decision Support</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setDeepThink(!deepThink)}
            style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              border: deepThink ? '1px solid #6366f1' : '1px solid #d1d5db',
              background: deepThink ? '#eef2ff' : '#fff',
              color: deepThink ? '#4f46e5' : '#6b7280',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
            ◉ 深度思考 {deepThink ? 'ON' : ''}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {chatMsgs.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 16,
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: 6, marginRight: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 11, fontWeight: 700, marginTop: 2,
              }}>AI</div>
            )}
            <div style={{ maxWidth: '75%' }}>
              {msg.attachmentType && msg.attachmentName && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 10px', borderRadius: 8, background: '#f3f4f6',
                  fontSize: 12, color: '#374151', marginBottom: 4,
                }}>
                  <span>{msg.attachmentType === 'image' ? '🖼' : msg.attachmentType === 'ppt' ? '▦' : '📄'}</span>
                  {msg.attachmentName}
                </div>
              )}
              <div style={{
                padding: '10px 14px', borderRadius: 12,
                background: msg.role === 'user' ? '#4f46e5' : '#f9fafb',
                color: msg.role === 'user' ? '#fff' : '#1f2937',
                border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                fontSize: 13.5, lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <div key={i} style={{ fontWeight: 600, margin: '4px 0' }}>{line.replace(/\*\*/g, '')}</div>;
                  }
                  if (line.startsWith('- ')) {
                    return <div key={i} style={{ paddingLeft: 12 }}>• {line.slice(2)}</div>;
                  }
                  if (line.startsWith('---')) {
                    return <hr key={i} style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />;
                  }
                  const parts = line.split(/(\[\d+\])/);
                  if (parts.length > 1) {
                    return <div key={i}>{parts.map((part, j) =>
                      /^\[\d+\]$/.test(part)
                        ? <sup key={j} style={{ color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}>{part}</sup>
                        : part
                    )}</div>;
                  }
                  return line ? <div key={i}>{line}</div> : <br key={i} />;
                })}
              </div>

              {/* Download button */}
              {msg.downloadable && (
                <button
                  onClick={() => downloadFile(msg.downloadable!.filename, msg.downloadable!.content, msg.downloadable!.type)}
                  style={{
                    marginTop: 8, padding: '8px 16px', borderRadius: 8,
                    background: '#4f46e5', color: '#fff', border: 'none',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  <span>↓</span> 下载文件
                </button>
              )}

              {/* References */}
              {msg.references && msg.references.length > 0 && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: '#f0f4ff', borderRadius: 8, border: '1px solid #e0e7ff' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#4338ca', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>参考文献</div>
                  {msg.references.map((ref, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4, cursor: ref.url ? 'pointer' : 'default' }}
                      onClick={() => ref.url && openReference(ref)}>
                      <span style={{ color: '#6366f1', fontSize: 11, fontWeight: 600, flexShrink: 0, marginTop: 1 }}>[{i + 1}]</span>
                      <div>
                        <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 500, textDecoration: ref.url ? 'underline' : 'none' }}>{ref.title}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{ref.journal} · {ref.year}{ref.doi ? ` · DOI: ${ref.doi}` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {msg.timestamp}
              </div>
            </div>
            {msg.role === 'user' && (
              <div style={{
                width: 28, height: 28, borderRadius: 6, marginLeft: 10, flexShrink: 0,
                background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#6b7280', fontSize: 12, marginTop: 2,
              }}>U</div>
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6, marginRight: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 11, fontWeight: 700,
            }}>AI</div>
            <div style={{ padding: '12px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12 }}>
              {deepThink
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6366f1' }}>
                    <div className="typing-dot" style={{ background: '#6366f1' }}></div>
                    <div className="typing-dot" style={{ background: '#6366f1' }}></div>
                    <div className="typing-dot" style={{ background: '#6366f1' }}></div>
                    <span style={{ marginLeft: 4 }}>深度分析中，正在检索文献...</span>
                  </div>
                : <div style={{ display: 'flex', gap: 4 }}>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
              }
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Skill Form Panel */}
      {activeSkill && activeSkill !== 'deep-think' && (
        <div style={{
          padding: '12px 24px', borderTop: '1px solid #e5e7eb',
          background: '#f9fafb',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{SKILLS.find(s => s.id === activeSkill)?.icon}</span>
              {SKILLS.find(s => s.id === activeSkill)?.label}
              <span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280' }}>
                — {SKILLS.find(s => s.id === activeSkill)?.description}
              </span>
            </div>
            <button onClick={() => { setActiveSkill(null); setSkillForm({ topic: '', format: 'docx', extra: '' }); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <input
                value={skillForm.topic}
                onChange={e => setSkillForm(prev => ({ ...prev, topic: e.target.value }))}
                placeholder={getSkillFormConfig(activeSkill).placeholder}
                onKeyDown={e => e.key === 'Enter' && handleSkillSubmit()}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: '1px solid #d1d5db', fontSize: 13, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ width: 150 }}>
              <input
                value={skillForm.extra}
                onChange={e => setSkillForm(prev => ({ ...prev, extra: e.target.value }))}
                placeholder={getSkillFormConfig(activeSkill).extraLabel}
                onKeyDown={e => e.key === 'Enter' && handleSkillSubmit()}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: '1px solid #d1d5db', fontSize: 12, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button onClick={handleSkillSubmit} disabled={!skillForm.topic.trim()}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: skillForm.topic.trim() ? '#4f46e5' : '#e5e7eb',
                color: '#fff', fontSize: 13, fontWeight: 500,
                cursor: skillForm.topic.trim() ? 'pointer' : 'default',
              }}>生成</button>
          </div>
        </div>
      )}

      {/* Skill Bar */}
      <div style={{
        display: 'flex', gap: 6, padding: '6px 24px',
        borderTop: '1px solid #f3f4f6', background: '#fff',
        flexWrap: 'wrap',
      }}>
        {SKILLS.map(skill => {
          const isActive = skill.id === 'deep-think' ? deepThink : activeSkill === skill.id;
          return (
            <button key={skill.id} onClick={() => toggleSkill(skill.id)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
              border: isActive ? '1px solid #6366f1' : '1px solid #e5e7eb',
              background: isActive ? '#eef2ff' : '#fff',
              color: isActive ? '#4f46e5' : '#6b7280',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ fontSize: 13 }}>{skill.icon}</span>
              {skill.label}
            </button>
          );
        })}
      </div>

      {/* Input Area */}
      <div style={{ padding: '10px 24px 16px', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 8,
          border: '1px solid #d1d5db', borderRadius: 12, padding: '8px 12px',
          transition: 'border-color 0.2s',
        }}>
          <button onClick={handleImageUpload} title="上传图片" style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: '#9ca3af', fontSize: 18, flexShrink: 0,
          }}>⊕</button>
          <button onClick={handleFileUpload} title="上传文件" style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: '#9ca3af', fontSize: 16, flexShrink: 0,
          }}>▤</button>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={e => { setInputText(e.target.value); }}
            onKeyDown={handleKeyDown}
            placeholder="输入医学问题...支持多模态输入"
            rows={1}
            style={{
              flex: 1, border: 'none', outline: 'none', resize: 'none',
              fontSize: 13.5, lineHeight: 1.5, fontFamily: 'inherit',
              minHeight: 24, maxHeight: 100, background: 'transparent',
              color: '#1f2937',
            }}
          />
          <button onClick={handleSend} disabled={isLoading || !inputText.trim()} style={{
            background: inputText.trim() && !isLoading ? '#4f46e5' : '#e5e7eb',
            border: 'none', borderRadius: 8, padding: '6px 14px',
            color: '#fff', fontSize: 13, fontWeight: 500,
            cursor: inputText.trim() && !isLoading ? 'pointer' : 'default',
            transition: 'all 0.2s', flexShrink: 0,
          }}>发送</button>
        </div>
      </div>
    </div>
  );
}
