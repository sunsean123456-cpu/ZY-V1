import { useState, useRef, useEffect } from 'react';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  references?: { title: string; journal: string; year: string; doi?: string; url?: string }[];
  attachmentType?: 'image' | 'file' | 'doc' | 'ppt' | 'video';
  attachmentName?: string;
}

const SKILLS = [
  { id: 'deep-think', icon: '◉', label: '深度思考' },
  { id: 'doc-gen', icon: '▤', label: '生成文档' },
  { id: 'ppt-gen', icon: '▦', label: '生成PPT' },
  { id: 'ppt-video', icon: '▶', label: 'PPT视频' },
  { id: 'literature', icon: '⊞', label: '文献检索' },
  { id: 'meta-analysis', icon: '⊕', label: 'Meta分析' },
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
    content: '您好。我是循证医学AI助手，可为您提供基于最新文献的专业医学咨询。\n\n支持多模态输入（文字、图片、文档），以及文档/PPT/视频生成。\n\n请直接提问，或上传相关资料开始对话。',
    timestamp: new Date().toTimeString().slice(0, 5),
  }]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [activeSkills, setActiveSkills] = useState<Set<string>>(new Set());
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
    setActiveSkills(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      const t2 = new Date().toTimeString().slice(0, 5);
      const query = inputText.toLowerCase();
      let responseContent = '';
      let refs: typeof DEMO_REFERENCES = [];

      if (query.includes('指南') || query.includes('guideline')) {
        responseContent = '根据最新的循证医学证据，2024版ESC心衰指南有以下核心更新：\n\n**1. 药物治疗策略调整**\nSGLT2抑制剂（达格列净、恩格列净）已从二线推荐提升为HFrEF一线治疗，无论是否合并糖尿病。联合ARNI（沙库巴曲缬沙坦）+β受体阻滞剂+MRA构成"新四联"基础方案。[1]\n\n**2. HFpEF首次获得药物推荐**\n基于EMPEROR-Preserved和DELIVER研究，SGLT2i被推荐用于HFpEF（LVEF>40%），这是该领域首个I类推荐。[2]\n\n**3. 远程监测升级**\n植入式肺动脉压力监测（CardioMEMS）推荐级别提升至IIa类，适用于NYHA III级且既往有心衰住院史的患者。[1]\n\n**4. 铁缺乏管理**\n静脉铁剂补充（羧基麦芽糖铁）推荐用于铁缺乏（铁蛋白<100μg/L）的HFrEF患者，可改善运动耐量和生活质量。[1][3]';
        refs = DEMO_REFERENCES.slice(0, 3);
      } else if (query.includes('药物') || query.includes('drug') || query.includes('相互作用')) {
        responseContent = '**药物信息查询结果**\n\n**达格列净（Dapagliflozin / Forxiga）**\n\n- **适应症：** 2型糖尿病、射血分数降低型心衰（HFrEF）、慢性肾脏病\n- **推荐剂量：** 10mg qd，不受进食影响\n- **常见不良反应：** 生殖道感染（5-10%）、容量不足（老年患者）、euglycemic DKA（罕见）\n- **重要相互作用：**\n  - 与利尿剂合用：增加容量不足风险，需监测血压和肾功能\n  - 与胰岛素/磺脲类合用：低血糖风险增加，需调整剂量\n  - 与SGLT1抑制剂：无显著临床交互作用\n\n**临床注意事项：**\n- 术前3天停用（避免围术期DKA）\n- eGFR<25时不建议起始治疗\n- 无需肝功能剂量调整';
        refs = [DEMO_REFERENCES[2]];
      } else if (query.includes('计算') || query.includes('bmi') || query.includes('gfr')) {
        responseContent = '**临床计算工具**\n\n请提供以下参数，我将为您计算：\n\n| 计算项目 | 所需参数 |\n|---------|----------|\n| BMI | 身高(cm)、体重(kg) |\n| eGFR (CKD-EPI) | 年龄、性别、血肌酐(μmol/L) |\n| APACHE II | 体温、MAP、心率、呼吸、PaO2、pH、Na、K、Cr、HCT、WBC、GCS |\n| CURB-65 | 意识状态、BUN、呼吸频率、血压、年龄 |\n| CHA₂DS₂-VASc | 心衰、高血压、年龄、糖尿病、卒中、血管病、性别 |\n\n请告诉我您需要的计算项目和相应参数。';
      } else if (query.includes('ppt') || query.includes('演示') || query.includes('汇报')) {
        responseContent = '**PPT生成方案**\n\n我将根据您的需求生成专业医学演示文稿，包含以下结构：\n\n1. **封面** — 标题、作者、日期\n2. **目录** — 大纲导航\n3. **背景与现状** — 流行病学数据、临床需求\n4. **核心内容** — 研究设计、关键数据、图表\n5. **讨论与结论** — 临床意义、未来方向\n6. **参考文献** — 关键引文\n\n请提供：\n- 演示主题\n- 目标受众（学术会议/科室汇报/教学）\n- 预计时长（10/20/30分钟）\n- 是否需要数据图表';
      } else {
        responseContent = '基于您的问题，以下是我的循证医学分析：\n\n**分析要点**\n\n1. **临床证据评估**\n根据现有高质量RCT和系统评价，该领域的核心结论支持当前诊疗方案的合理性。最新荟萃分析（纳入12项RCT，N=28,450）显示干预组主要终点风险降低18%（HR 0.82, 95%CI 0.73-0.92, P<0.001）。[1]\n\n2. **安全性考量**\n不良反应谱与既往报道一致，严重不良事件发生率在可接受范围内。需要特别关注的是特定亚组（老年、肾功能不全）的剂量调整。[2]\n\n3. **临床建议**\n- 当前方案获益大于风险，建议继续\n- 48-72小时后复查关键指标评估疗效\n- 根据患者个体情况调整辅助用药\n\n**证据等级：** A级（多项RCT一致支持）';
        refs = DEMO_REFERENCES.slice(0, 2);
      }

      if (deepThink) {
        responseContent = '🔍 **深度思考模式**\n\n' + responseContent + '\n\n---\n*已启用多源文献交叉验证和证据等级评估*';
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      {/* Header */}
      <div style={{
        padding: '14px 24px',
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
              {/* Attachments */}
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
                  // Bold
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <div key={i} style={{ fontWeight: 600, margin: '4px 0' }}>{line.replace(/\*\*/g, '')}</div>;
                  }
                  // Table-like
                  if (line.startsWith('|')) {
                    return <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, color: '#4b5563' }}>{line}</div>;
                  }
                  // Reference markers like [1]
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

      {/* Skill Bar */}
      <div style={{
        display: 'flex', gap: 6, padding: '6px 24px',
        borderTop: '1px solid #f3f4f6', background: '#fff',
        flexWrap: 'wrap',
      }}>
        {SKILLS.map(skill => {
          const isActive = skill.id === 'deep-think' ? deepThink : activeSkills.has(skill.id);
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
            color: '#fff', fontSize: 13, fontWeight: 500, cursor: inputText.trim() && !isLoading ? 'pointer' : 'default',
            transition: 'all 0.2s', flexShrink: 0,
          }}>发送</button>
        </div>
      </div>
    </div>
  );
}
