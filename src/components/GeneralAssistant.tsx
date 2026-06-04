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

const SKILLS = [
  { id: 'deep-think', icon: '◉', label: '深度思考' },
  { id: 'doc-gen', icon: '▤', label: '生成文档' },
  { id: 'ppt-gen', icon: '▦', label: '生成PPT' },
  { id: 'ppt-speak', icon: '♫', label: 'PPT Speak' },
];

const DEMO_REFS = [
  { title: 'Effect of SGLT2 Inhibitors on Cardiovascular Outcomes in Heart Failure', journal: 'New England Journal of Medicine', year: '2024', doi: '10.1056/NEJMoa2314290', url: 'https://doi.org/10.1056/NEJMoa2314290' },
  { title: '2024 ESC Guidelines for Heart Failure Management', journal: 'European Heart Journal', year: '2024', doi: '10.1093/eurheartj/ehae178', url: 'https://doi.org/10.1093/eurheartj/ehae178' },
  { title: 'GLP-1 Receptor Agonists in Type 2 Diabetes: A Systematic Review', journal: 'The Lancet Diabetes & Endocrinology', year: '2024', doi: '10.1016/S2213-8587(24)00115-9', url: 'https://doi.org/10.1016/S2213-8587(24)00115-9' },
  { title: 'AI-Assisted Diagnosis in Clinical Practice', journal: 'JAMA', year: '2025', doi: '10.1001/jama.2025.1234', url: 'https://doi.org/10.1001/jama.2025.1234' },
];

// Skill parameter configs
interface SkillParams {
  docGen: { format: string; length: string; focus: string };
  pptGen: { slides: string; style: string; scenario: string };
  pptSpeak: { file: File | null; duration: string };
}

export default function GeneralAssistant() {
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([{
    id: 'welcome',
    role: 'assistant',
    content: '您好。我是查查鱼循证医学AI助手，为您提供基于最新文献的专业医学咨询。\n\n支持多模态输入（文字、图片、文档），以及文档/PPT生成和演讲辅助。\n\n请直接提问，或选择下方技能开始。',
    timestamp: new Date().toTimeString().slice(0, 5),
  }]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [skillParams, setSkillParams] = useState<SkillParams>({
    docGen: { format: 'docx', length: '2000字', focus: '' },
    pptGen: { slides: '8', style: '学术', scenario: '科室汇报' },
    pptSpeak: { file: null, duration: '15' },
  });
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
    setActiveSkill(activeSkill === id ? null : id);
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

  const openReference = (ref: { url?: string }) => {
    if (ref.url) {
      try {
        if ((window as any).__TAURI__) {
          import('@tauri-apps/plugin-shell').then(({ open }) => open(ref.url!));
        } else { window.open(ref.url, '_blank'); }
      } catch { window.open(ref.url, '_blank'); }
    }
  };

  const handleFileUpload = (accept: string, callback: (file: File) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) callback(file);
    };
    input.click();
  };

  // Handle skill submit
  const handleSkillAction = () => {
    if (!activeSkill) return;
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);

    if (activeSkill === 'doc-gen') {
      const p = skillParams.docGen;
      setChatMsgs(prev => [...prev, {
        id: `req_${Date.now()}`, role: 'user', timestamp: timeStr,
        content: `请生成文档${p.focus ? `：${p.focus}` : ''}\n格式：${p.format} | 篇幅：${p.length}`,
      }]);
      setActiveSkill(null);
      setIsLoading(true);
      setTimeout(() => {
        const t2 = new Date().toTimeString().slice(0, 5);
        const topic = p.focus || '医学专题文档';
        const doc = `${topic}\n\n一、概述\n${topic}是当前医学领域的重要研究方向。本文基于最新循证医学证据进行系统梳理。\n\n二、背景与现状\n根据最新流行病学数据，该领域发病率和治疗需求呈以下趋势：\n1. 发病率逐年上升，尤其在老龄化社会中更为显著\n2. 诊断技术不断进步，早期检出率提高\n3. 治疗方案日益多样化，个体化治疗成为趋势\n\n三、诊断标准\n基于2024年最新指南推荐：\n- 主要诊断依据：临床表现 + 辅助检查\n- 辅助检查：实验室检查、影像学检查\n- 鉴别诊断：需排除相关疾病\n\n四、治疗策略\n4.1 一线治疗方案\n根据多项RCT研究结果，推荐以下一线治疗方案：\n- 药物治疗：基于循证证据A级推荐\n- 非药物干预：生活方式调整、康复训练\n\n4.2 二线及补救治疗\n当一线治疗效果不佳时，可考虑联合用药或新型治疗手段。\n\n五、预后与随访\n- 短期预后：多数患者可获得良好改善\n- 长期管理：需要定期随访和监测\n\n六、总结\n${topic}的诊疗需要多学科协作，基于最新循证证据制定个体化方案。\n\n参考文献\n[1] 相关领域最新Meta分析, Journal of Clinical Medicine, 2024\n[2] 最新诊疗指南, European Heart Journal, 2024\n[3] 治疗策略专家共识, The Lancet, 2025\n\n---\n查查鱼AI助手生成 · ${new Date().toLocaleString('zh-CN')}`;
        setChatMsgs(prev => [...prev, {
          id: `gen_${Date.now()}`, role: 'assistant', timestamp: t2,
          content: `文档已生成完毕。\n\n**文档概要：${topic}**\n\n结构：概述 → 背景 → 诊断 → 治疗 → 预后 → 总结\n篇幅约${p.length}，含参考文献。\n\n点击下方按钮下载文档 ↓`,
          downloadable: { filename: `${topic.replace(/\s+/g, '_')}.doc.txt`, content: doc, type: 'text/plain' },
          references: DEMO_REFS.slice(0, 2),
        }]);
        setIsLoading(false);
      }, 2000);
    }

    if (activeSkill === 'ppt-gen') {
      const p = skillParams.pptGen;
      const n = parseInt(p.slides) || 8;
      setChatMsgs(prev => [...prev, {
        id: `req_${Date.now()}`, role: 'user', timestamp: timeStr,
        content: `请生成PPT\n风格：${p.style} | 场景：${p.scenario} | 页数：${n}页`,
      }]);
      setActiveSkill(null);
      setIsLoading(true);
      setTimeout(() => {
        const t2 = new Date().toTimeString().slice(0, 5);
        const slides = [
          { title: '封面', body: '标题 · 作者 · 日期', notes: '开场白' },
          { title: '目录', body: '1.背景 2.诊断 3.治疗 4.研究 5.总结', notes: '简要介绍汇报结构' },
          { title: '背景与现状', body: '流行病学数据·高危人群·疾病负担', notes: '引用WHO最新数据' },
          { title: '诊断标准更新', body: '2024指南变化·新标志物·影像学进展', notes: '对比新旧指南差异' },
          { title: '治疗策略', body: '一线方案·个体化治疗·联合策略', notes: '结合病例说明' },
          { title: '最新研究', body: '关键RCT结果·亚组分析·安全性', notes: '用数据说话' },
          { title: '临床建议', body: '诊断流程·方案选择·随访管理', notes: '转化为可操作建议' },
          { title: '总结与展望', body: '核心要点·未来方向', notes: '总结3-5个take-home message' },
        ].slice(0, n);
        let ppt = `演示文稿（${p.style}风格 · ${p.scenario}场景）\n共 ${slides.length} 页\n\n`;
        slides.forEach((s, i) => { ppt += `━━━ 第 ${i + 1} 页 ━━━\n标题：${s.title}\n内容：${s.body}\n演讲备注：${s.notes}\n\n`; });
        setChatMsgs(prev => [...prev, {
          id: `gen_${Date.now()}`, role: 'assistant', timestamp: t2,
          content: `PPT已生成完毕。\n\n**共 ${slides.length} 页**（${p.style}风格 · ${p.scenario}场景）\n每页均包含演讲备注。\n\n点击下方按钮下载 ↓`,
          downloadable: { filename: `演示文稿_${slides.length}页.txt`, content: ppt, type: 'text/plain' },
        }]);
        setIsLoading(false);
      }, 2000);
    }

    if (activeSkill === 'ppt-speak') {
      const p = skillParams.pptSpeak;
      const uploadedFile = p.file;
      if (!uploadedFile) { alert('请先上传PPT文件'); return; }
      setChatMsgs(prev => [...prev, {
        id: `req_${Date.now()}`, role: 'user', timestamp: timeStr,
        content: `请为PPT生成演讲稿\n文件：${uploadedFile.name} | 时长：${p.duration}分钟`,
        attachmentType: 'ppt', attachmentName: uploadedFile.name,
      }]);
      setActiveSkill(null);
      setIsLoading(true);
      setTimeout(() => {
        const t2 = new Date().toTimeString().slice(0, 5);
        const mins = parseInt(p.duration) || 15;
        const speech = `演讲稿（基于 ${uploadedFile.name}，总时长 ${mins} 分钟）\n\n【开场】（约${Math.round(mins * 0.1)}分钟）\n各位老师、同事，大家好。今天我将为大家汇报...\n\n【背景介绍】（约${Math.round(mins * 0.15)}分钟）\n首先看一些关键数据。根据最新流行病学调查...\n（翻页）特别值得注意的是...\n\n【核心内容】（约${Math.round(mins * 0.4)}分钟）\n这是今天汇报的重点...\n（翻页）具体来说...\n（翻页）从数据来看...\n\n【研究进展】（约${Math.round(mins * 0.2)}分钟）\n最近发表的关键研究...\n\n【总结】（约${Math.round(mins * 0.1)}分钟）\n核心要点：\n第一...\n第二...\n第三...\n\n【问答准备】\nQ1: 适用性问题？ A: 根据亚组分析...\nQ2: 成本效益？ A: 从药物经济学角度...\n\n---\n查查鱼AI助手生成 · ${new Date().toLocaleString('zh-CN')}`;
        setChatMsgs(prev => [...prev, {
          id: `gen_${Date.now()}`, role: 'assistant', timestamp: t2,
          content: `演讲稿已生成完毕。\n\n**基于：${uploadedFile.name}**\n**时长：${mins}分钟**\n\n含开场白、核心内容、总结、问答准备。\n\n点击下方按钮下载 ↓`,
          downloadable: { filename: `演讲稿_${uploadedFile.name.replace(/\.[^.]+$/, '')}.txt`, content: speech, type: 'text/plain' },
        }]);
        setIsLoading(false);
      }, 2000);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    setChatMsgs(prev => [...prev, { id: `msg_${Date.now()}`, role: 'user', content: inputText, timestamp: timeStr }]);
    const query = inputText;
    setInputText('');
    setIsLoading(true);
    setTimeout(() => {
      const t2 = new Date().toTimeString().slice(0, 5);
      const q = query.toLowerCase();
      let content = '';
      let refs: typeof DEMO_REFS = [];
      if (q.includes('指南') || q.includes('guideline')) {
        content = '根据最新循证医学证据，2024版ESC心衰指南核心更新：\n\n**1. 药物治疗策略调整**\nSGLT2抑制剂已提升为HFrEF一线治疗，联合ARNI + β受体阻滞剂 + MRA构成"新四联"基础方案。[1]\n\n**2. HFpEF首次获得药物推荐**\n基于EMPEROR-Preserved和DELIVER研究，SGLT2i被推荐用于HFpEF（LVEF>40%）。[2]\n\n**3. 远程监测升级**\n植入式肺动脉压力监测推荐级别提升至IIa类。[1]\n\n**证据等级：** A级（多项RCT一致支持）';
        refs = DEMO_REFS.slice(0, 3);
      } else if (q.includes('药物') || q.includes('drug')) {
        content = '**药物信息查询结果**\n\n**达格列净（Dapagliflozin）**\n- 适应症：2型糖尿病、HFrEF、慢性肾脏病\n- 推荐剂量：10mg qd\n- 常见不良反应：生殖道感染（5-10%）、容量不足\n\n**重要相互作用：**\n- 与利尿剂合用：增加容量不足风险\n- 与胰岛素/磺脲类合用：低血糖风险增加\n\n**临床注意事项：**\n- 术前3天停用\n- eGFR<25时不建议起始治疗';
        refs = [DEMO_REFS[2]];
      } else {
        content = '基于您的问题，以下是循证医学分析：\n\n**分析要点**\n\n1. **临床证据评估**\n最新荟萃分析（纳入12项RCT，N=28,450）显示干预组主要终点风险降低18%（HR 0.82, 95%CI 0.73-0.92, P<0.001）。[1]\n\n2. **安全性考量**\n不良反应谱与既往报道一致，严重不良事件发生率在可接受范围内。[2]\n\n3. **临床建议**\n- 当前方案获益大于风险，建议继续\n- 48-72小时后复查关键指标\n- 根据患者个体情况调整辅助用药\n\n**证据等级：** A级';
        refs = DEMO_REFS.slice(0, 2);
      }
      if (deepThink) { content = '**深度思考模式**\n\n' + content + '\n\n---\n*已启用多源文献交叉验证和证据等级评估*'; }
      setChatMsgs(prev => [...prev, { id: `msg_${Date.now()}_ai`, role: 'assistant', content, timestamp: t2, references: refs.length > 0 ? refs : undefined }]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  // Render skill parameter fields inline
  const renderSkillFields = () => {
    if (!activeSkill || activeSkill === 'deep-think') return null;
    const fieldStyle: React.CSSProperties = {
      padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db',
      fontSize: 12, outline: 'none', background: '#fff', color: '#374151',
    };
    const selectStyle: React.CSSProperties = { ...fieldStyle, cursor: 'pointer' };
    const labelStyle: React.CSSProperties = { fontSize: 11, color: '#6b7280', fontWeight: 500 };

    if (activeSkill === 'doc-gen') {
      return (
        <div style={{ display: 'flex', gap: 10, padding: '8px 24px', background: '#f8fafc', borderTop: '1px solid #f3f4f6', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>▤ 生成文档</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={labelStyle}>格式</span>
            <select value={skillParams.docGen.format} onChange={e => setSkillParams(p => ({ ...p, docGen: { ...p.docGen, format: e.target.value } }))} style={selectStyle}>
              <option value="docx">Word (.docx)</option>
              <option value="pdf">PDF</option>
              <option value="md">Markdown</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={labelStyle}>篇幅</span>
            <select value={skillParams.docGen.length} onChange={e => setSkillParams(p => ({ ...p, docGen: { ...p.docGen, length: e.target.value } }))} style={selectStyle}>
              <option value="1000字">约1000字</option>
              <option value="2000字">约2000字</option>
              <option value="3000字">约3000字</option>
              <option value="5000字">约5000字</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 150 }}>
            <span style={labelStyle}>主题/重点</span>
            <input value={skillParams.docGen.focus} onChange={e => setSkillParams(p => ({ ...p, docGen: { ...p.docGen, focus: e.target.value } }))}
              placeholder="如：急性心梗诊疗规范，重点写药物治疗" style={{ ...fieldStyle, width: '100%' }}
              onKeyDown={e => e.key === 'Enter' && handleSkillAction()} />
          </div>
          <button onClick={handleSkillAction} disabled={!skillParams.docGen.focus.trim()} style={{
            padding: '6px 16px', borderRadius: 6, border: 'none', marginTop: 14,
            background: skillParams.docGen.focus.trim() ? '#4f46e5' : '#d1d5db',
            color: '#fff', fontSize: 12, fontWeight: 500, cursor: skillParams.docGen.focus.trim() ? 'pointer' : 'default',
          }}>生成</button>
        </div>
      );
    }

    if (activeSkill === 'ppt-gen') {
      return (
        <div style={{ display: 'flex', gap: 10, padding: '8px 24px', background: '#f8fafc', borderTop: '1px solid #f3f4f6', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>▦ 生成PPT</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={labelStyle}>页数</span>
            <select value={skillParams.pptGen.slides} onChange={e => setSkillParams(p => ({ ...p, pptGen: { ...p.pptGen, slides: e.target.value } }))} style={selectStyle}>
              <option value="5">5页</option>
              <option value="8">8页</option>
              <option value="10">10页</option>
              <option value="15">15页</option>
              <option value="20">20页</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={labelStyle}>风格</span>
            <select value={skillParams.pptGen.style} onChange={e => setSkillParams(p => ({ ...p, pptGen: { ...p.pptGen, style: e.target.value } }))} style={selectStyle}>
              <option value="学术">学术严谨</option>
              <option value="简约">简约现代</option>
              <option value="商务">商务汇报</option>
              <option value="教学">教学课件</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={labelStyle}>场景</span>
            <select value={skillParams.pptGen.scenario} onChange={e => setSkillParams(p => ({ ...p, pptGen: { ...p.pptGen, scenario: e.target.value } }))} style={selectStyle}>
              <option value="科室汇报">科室汇报</option>
              <option value="学术会议">学术会议</option>
              <option value="教学查房">教学查房</option>
              <option value="病例讨论">病例讨论</option>
              <option value="科研开题">科研开题</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 120 }}>
            <span style={labelStyle}>主题</span>
            <input value={skillParams.docGen.focus} onChange={e => setSkillParams(p => ({ ...p, docGen: { ...p.docGen, focus: e.target.value } }))}
              placeholder="输入PPT主题" style={{ ...fieldStyle, width: '100%' }}
              onKeyDown={e => e.key === 'Enter' && handleSkillAction()} />
          </div>
          <button onClick={handleSkillAction} disabled={!skillParams.docGen.focus.trim()} style={{
            padding: '6px 16px', borderRadius: 6, border: 'none', marginTop: 14,
            background: skillParams.docGen.focus.trim() ? '#4f46e5' : '#d1d5db',
            color: '#fff', fontSize: 12, fontWeight: 500, cursor: skillParams.docGen.focus.trim() ? 'pointer' : 'default',
          }}>生成</button>
        </div>
      );
    }

    if (activeSkill === 'ppt-speak') {
      return (
        <div style={{ display: 'flex', gap: 10, padding: '8px 24px', background: '#f8fafc', borderTop: '1px solid #f3f4f6', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>♫ PPT Speak</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={labelStyle}>上传PPT</span>
            <button onClick={() => handleFileUpload('.ppt,.pptx', (file) => {
              setSkillParams(p => ({ ...p, pptSpeak: { ...p.pptSpeak, file } }));
            })} style={{
              ...fieldStyle, cursor: 'pointer', background: skillParams.pptSpeak.file ? '#eef2ff' : '#fff',
              borderColor: skillParams.pptSpeak.file ? '#6366f1' : '#d1d5db',
              color: skillParams.pptSpeak.file ? '#4f46e5' : '#6b7280',
            }}>
              {skillParams.pptSpeak.file ? `✓ ${skillParams.pptSpeak.file.name}` : '选择PPT文件'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={labelStyle}>演讲时长</span>
            <select value={skillParams.pptSpeak.duration} onChange={e => setSkillParams(p => ({ ...p, pptSpeak: { ...p.pptSpeak, duration: e.target.value } }))} style={selectStyle}>
              <option value="5">5分钟</option>
              <option value="10">10分钟</option>
              <option value="15">15分钟</option>
              <option value="20">20分钟</option>
              <option value="30">30分钟</option>
            </select>
          </div>
          <button onClick={handleSkillAction} disabled={!skillParams.pptSpeak.file} style={{
            padding: '6px 16px', borderRadius: 6, border: 'none', marginTop: 14,
            background: skillParams.pptSpeak.file ? '#4f46e5' : '#d1d5db',
            color: '#fff', fontSize: 12, fontWeight: 500, cursor: skillParams.pptSpeak.file ? 'pointer' : 'default',
          }}>生成演讲稿</button>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, background: '#fff' }}>
      {/* Header */}
      <div style={{
        padding: '12px 24px', borderBottom: '1px solid #e5e7eb', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" fill="none" stroke="#fff" strokeWidth="1.5"/>
              <path d="M8 14c1.5 2 5.5 2 8 0" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="10" r="1.2" fill="#fff"/>
              <circle cx="15" cy="10" r="1.2" fill="#fff"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>查查鱼 · 循证医学助手</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Evidence-Based Medicine · Research & Decision Support</div>
          </div>
        </div>
        <button onClick={() => setDeepThink(!deepThink)} style={{
          padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
          border: deepThink ? '1px solid #6366f1' : '1px solid #d1d5db',
          background: deepThink ? '#eef2ff' : '#fff',
          color: deepThink ? '#4f46e5' : '#6b7280', cursor: 'pointer',
        }}>◉ 深度思考 {deepThink ? 'ON' : ''}</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {chatMsgs.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: 6, marginRight: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M8 14c1.5 2 5.5 2 8 0" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="10" r="1.2" fill="#fff"/><circle cx="15" cy="10" r="1.2" fill="#fff"/>
                </svg>
              </div>
            )}
            <div style={{ maxWidth: '75%' }}>
              {msg.attachmentType && msg.attachmentName && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: '#f3f4f6', fontSize: 12, color: '#374151', marginBottom: 4 }}>
                  <span>{msg.attachmentType === 'image' ? '⊕' : msg.attachmentType === 'ppt' ? '▦' : '▤'}</span>
                  {msg.attachmentName}
                </div>
              )}
              <div style={{
                padding: '10px 14px', borderRadius: 12,
                background: msg.role === 'user' ? '#4f46e5' : '#f9fafb',
                color: msg.role === 'user' ? '#fff' : '#1f2937',
                border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                fontSize: 13.5, lineHeight: 1.65, whiteSpace: 'pre-wrap',
              }}>
                {msg.content.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) return <div key={i} style={{ fontWeight: 600, margin: '4px 0' }}>{line.replace(/\*\*/g, '')}</div>;
                  if (line.startsWith('- ')) return <div key={i} style={{ paddingLeft: 12 }}>• {line.slice(2)}</div>;
                  if (line.startsWith('---')) return <hr key={i} style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />;
                  const parts = line.split(/(\[\d+\])/);
                  if (parts.length > 1) return <div key={i}>{parts.map((part, j) => /^\[\d+\]$/.test(part) ? <sup key={j} style={{ color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}>{part}</sup> : part)}</div>;
                  return line ? <div key={i}>{line}</div> : <br key={i} />;
                })}
              </div>
              {msg.downloadable && (
                <button onClick={() => downloadFile(msg.downloadable!.filename, msg.downloadable!.content, msg.downloadable!.type)} style={{
                  marginTop: 8, borderRadius: 8,
                  background: '#4f46e5', color: '#fff', border: 'none',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>↓</span> 下载文件
                </button>
              )}
              {msg.references && msg.references.length > 0 && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: '#f0f4ff', borderRadius: 8, border: '1px solid #e0e7ff' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#4338ca', marginBottom: 6, letterSpacing: '0.5px' }}>REFERENCES</div>
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
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3, textAlign: msg.role === 'user' ? 'right' : 'left' }}>{msg.timestamp}</div>
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
              background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M8 14c1.5 2 5.5 2 8 0" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="9" cy="10" r="1.2" fill="#fff"/><circle cx="15" cy="10" r="1.2" fill="#fff"/>
              </svg>
            </div>
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

      {/* Skill Parameter Fields (inline, no separate dialog) */}
      {renderSkillFields()}

      {/* Skill Bar */}
      <div style={{
        display: 'flex', gap: 6, padding: '6px 24px',
        borderTop: '1px solid #f3f4f6', background: '#fff',
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
        }}>
          <button onClick={() => handleFileUpload('image/*', (file) => {
            const reader = new FileReader();
            reader.onload = () => {
              const t = new Date().toTimeString().slice(0, 5);
              setChatMsgs(prev => [...prev, { id: `img_${Date.now()}`, role: 'user', content: `已上传图片：${file.name}`, timestamp: t, attachmentType: 'image', attachmentName: file.name }]);
            };
            reader.readAsDataURL(file);
          })} title="上传图片" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9ca3af', fontSize: 18, flexShrink: 0 }}>⊕</button>
          <button onClick={() => handleFileUpload('.pdf,.doc,.docx,.ppt,.pptx,.txt', (file) => {
            const t = new Date().toTimeString().slice(0, 5);
            setChatMsgs(prev => [...prev, { id: `file_${Date.now()}`, role: 'user', content: `已上传：${file.name}`, timestamp: t, attachmentType: 'file', attachmentName: file.name }]);
          })} title="上传文件" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9ca3af', fontSize: 16, flexShrink: 0 }}>▤</button>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入医学问题..."
            rows={1}
            style={{
              flex: 1, border: 'none', outline: 'none', resize: 'none',
              fontSize: 13.5, lineHeight: 1.5, fontFamily: 'inherit',
              minHeight: 24, maxHeight: 100, background: 'transparent', color: '#1f2937',
            }}
          />
          <button onClick={handleSend} disabled={isLoading || !inputText.trim()} style={{
            background: inputText.trim() && !isLoading ? '#4f46e5' : '#e5e7eb',
            border: 'none', borderRadius: 8, padding: '6px 14px',
            color: '#fff', fontSize: 13, fontWeight: 500,
            cursor: inputText.trim() && !isLoading ? 'pointer' : 'default',
          }}>发送</button>
        </div>
      </div>
    </div>
  );
}
