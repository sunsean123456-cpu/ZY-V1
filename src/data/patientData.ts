import type { RichPatientData } from '../types';

export const patientsData: RichPatientData[] = [
  {
    id: 'p1', name: '张建国', sex: '男', age: 72, bed: '12床',
    admission: 'ZY20260527008', dx: '急性脑梗死 | 2型糖尿病 | 高血压',
    status: 'has-msg', group: 'pre-op', surgeryType: '待评估',
    initialMsgs: [
      { type:'doctor', text:'张建国患者今日新入院，右侧肢体无力伴言语不清3小时，既往高血压糖尿病史。请AI评估溶栓指征。', time:'09:35' },
      { type:'ai', text:'<div class="ai-conclusion">患者72岁男性，发病3小时，NIHSS约8分，在溶栓时间窗内。</div><div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">• 青霉素过敏史，需避免相关药物<br>• eGFR 58ml/min，肾功能轻度异常<br>• 需完善头颅CT排除出血</div></div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① 急查头颅CT平扫<br>② 凝血功能+血常规+血糖<br>③ 血压控制在180/105mmHg以下方可溶栓</div></div>', time:'09:38', actions:true },
      { type:'doctor', text:'已开具头颅CT和凝血功能检查。家属反映今早头晕。', time:'10:02' },
    ],
    pushSequence: [
      { type:'lab', text:'WBC 12.3↑ (参考值 4.0-10.0)\nCRP 45↑ (参考值 <5)\nNEUT% 85.2↑ (参考值 40-75)\n报告时间: 14:32', time:'14:32' },
      { type:'ai', text:'<div class="ai-conclusion">WBC和CRP显著升高，提示感染/炎症反应。</div><div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">• WBC 12.3↑，NEUT% 85.2↑，支持细菌感染<br>• CRP 45↑，炎症指标明显升高<br>• 结合脑梗死后卧床状态，需警惕肺部感染</div></div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① 完善降钙素原(PCT)检测<br>② 胸部X光检查<br>③ 加强体温监测（q4h）</div></div>', time:'14:34', actions:true },
      { type:'nurse', text:'BP 158/92↑\nHR 92\nT 37.8℃↑\nSpO2 95%\n测量时间: 14:50', time:'14:50' },
      { type:'ai', text:'<div class="ai-conclusion">血压偏高、体温轻度升高，结合检验结果，感染可能性大。</div><div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">• BP 158/92↑，高于目标值<br>• T 37.8℃↑，低热<br>• SpO2 95%，处于临界值</div></div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① 抗感染同时监测血压<br>② 必要时调整降压方案<br>③ 持续高热可能增加神经损伤风险</div></div>', time:'14:52', actions:true },
      { type:'family', text:'张建国今天早上说有点头晕，量了血压158/92，比平时高。还有咳嗽有痰，白色黏痰。\n\n家属反馈时间: 14:15', time:'14:15' },
      { type:'ai', text:'<div class="ai-conclusion">家属反馈与当前体征、检验结果一致，支持呼吸道感染判断。</div><div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">• 头晕与血压偏高(158/92)相符<br>• 咳嗽有痰 + WBC/CRP升高，进一步支持呼吸道感染</div></div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① 完善胸部影像检查<br>② PCT检测<br>③ 今日加测血压q4h<br>④ 考虑经验性抗感染治疗</div></div>', time:'14:55', actions:true },
    ],
    record: '<div class="section-title">入院记录</div>\n\n患者姓名：张建国  性别：男  年龄：72岁\n住院号：ZY20260527008  床位：12床\n\n<div class="section-title">主诉</div>\n右侧肢体无力伴言语不清3小时\n\n<div class="section-title">现病史</div>\n患者今日上午突发右侧肢体无力，伴言语不清，无意识障碍，无抽搐。既往高血压病史10年，2型糖尿病史8年。\n\n<div class="section-title">既往史</div>\n高血压10年，2型糖尿病8年。青霉素过敏史。\n\n<div class="section-title">体格检查</div>\nBP 158/92mmHg，神清，运动性失语，右侧鼻唇沟变浅，右上肢肌力3级，右下肢肌力4级，右侧Babinski征(+)。\n\n<div class="section-title">辅助检查</div>\n• WBC 12.3×10⁹/L↑\n• CRP 45mg/L↑\n• NEUT% 85.2%↑\n• eGFR 58ml/min\n\n<div class="section-title">初步诊断</div>\n1. 急性脑梗死（左侧大脑中动脉供血区）\n2. 2型糖尿病\n3. 高血压病3级（极高危）\n4. 疑似肺部感染',
    orders: [
      { name:'头颅CT平扫', detail:'急诊，排除脑出血' },
      { name:'凝血功能+血常规', detail:'评估溶栓条件' },
      { name:'胸部X光(正位)', detail:'排查肺部感染' },
      { name:'降钙素原(PCT)', detail:'评估细菌感染' },
      { name:'阿替普酶 0.9mg/kg', detail:'静脉溶栓（CT排除出血后）' },
      { name:'阿司匹林 100mg qd', detail:'抗血小板' },
      { name:'血压监测 q4h', detail:'溶栓期间密切监测' },
    ],
    consult: [
      { dept:'神经内科', content:'建议溶栓治疗，NIHSS 8分，获益大于风险。溶栓后密切监测神经功能变化。' },
      { dept:'心内科', content:'合并糖尿病+高血压，注意血压管理。溶栓前后BP<180/105mmHg。' },
      { dept:'呼吸科', content:'WBC/CRP升高，建议胸部CT排查肺部感染。经验性抗感染治疗。' },
      { dept:'药学部', content:'eGFR 58，抗生素需调整剂量。避免肾毒性药物联用。' },
    ],
    trends: { wbc:[4.2,5.1,6.8,8.5,10.2,11.8,12.3], crp:[2,5,12,22,32,40,45], neut:[55,60,68,72,78,82,85.2] },
    drg: { group:'急性脑梗死（M13）', weight:1.85, estimatedCost:28500, usedCost:12300, risk:'低', suggestions:['当前治疗方案在医保额度内','注意控制抗生素使用天数','建议48小时后评估溶栓效果，尽早康复'] }
  },
  {
    id: 'p2', name: '李秀英', sex: '女', age: 65, bed: '8床',
    admission: 'ZY20260526015', dx: '肺炎 | 冠心病',
    status: 'online', group: 'post-op', surgeryType: '阑尾切除术后第3天',
    initialMsgs: [
      { type:'doctor', text:'李秀英因发热咳嗽3天入院，既往冠心病史，请AI评估感染严重程度。', time:'08:20' },
      { type:'ai', text:'<div class="ai-conclusion">65岁女性，社区获得性肺炎可能性大。</div><div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">• 冠心病史需注意感染诱发心功能不全<br>• 需评估感染严重程度（CURB-65评分）</div></div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① 血常规+CRP+PCT<br>② 胸部CT平扫<br>③ 心电图+心肌酶谱</div></div>', time:'08:23', actions:true },
    ],
    pushSequence: [
      { type:'lab', text:'体温 38.5℃↑\nCRP 78↑↑ (参考值 <5)\nPCT 2.1↑ (参考值 <0.5)\nWBC 14.5↑ (参考值 4.0-10.0)', time:'10:10' },
      { type:'ai', text:'<div class="ai-conclusion">CRP明显升高、PCT 2.1提示细菌感染可能性大。</div><div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">• PCT 2.1↑，强烈提示细菌感染<br>• WBC 14.5↑，支持感染诊断<br>• 冠心病患者在感染应激下需关注心功能</div></div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① 启动经验性抗感染治疗<br>② 监测心电图变化<br>③ 评估心功能</div></div>', time:'10:12', actions:true },
      { type:'imaging', text:'胸部CT：右肺下叶斑片状密度增高影，考虑社区获得性肺炎。\n未见胸腔积液。\n结论：右肺下叶肺炎', time:'11:05' },
      { type:'ai', text:'<div class="ai-conclusion">胸部CT证实右肺下叶肺炎，与临床诊断一致。</div><div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">• 右肺下叶斑片状密度增高影<br>• 未见胸腔积液<br>• 注意：避免使用对心脏有影响的氟喹诺酮类药物</div></div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① 选择对心脏安全的抗生素<br>② 继续监测心功能<br>③ 48-72小时复查评估疗效</div></div>', time:'11:08', actions:true },
    ],
    record: '<div class="section-title">病程记录</div>\n\n患者：李秀英，女，65岁，8床\n日期：2026-05-27\n\n<div class="section-title">今日病情</div>\n患者发热咳嗽3天后入院，体温最高38.5℃。\n\n<div class="section-title">辅助检查</div>\n• WBC 14.5×10⁹/L↑\n• CRP 78mg/L↑↑\n• PCT 2.1ng/mL↑\n• 胸部CT：右肺下叶肺炎\n\n<div class="section-title">诊疗计划</div>\n1. 启动经验性抗感染治疗\n2. 监测心功能\n3. 对症支持治疗',
    orders: [
      { name:'头孢曲松 2g qd', detail:'经验性抗感染（避开氟喹诺酮）' },
      { name:'氨溴索 30mg tid', detail:'祛痰' },
      { name:'心电图 qd×3天', detail:'监测心功能变化' },
      { name:'心肌酶谱', detail:'基线评估' },
    ],
    consult: [
      { dept:'呼吸科', content:'社区获得性肺炎，建议头孢曲松+阿奇霉素联合治疗。' },
      { dept:'心内科', content:'冠心病史，避免氟喹诺酮类，监测心电图。' },
    ],
    trends: { wbc:[4.0,5.5,7.2,9.8,12.1,13.8,14.5], crp:[1,3,8,25,45,65,78], neut:[50,55,62,68,74,79,82] },
    drg: { group:'肺炎（M15）', weight:1.42, estimatedCost:18500, usedCost:8200, risk:'低', suggestions:['当前治疗方案合理','注意抗生素使用天数','建议72小时后评估疗效'] }
  },
  {
    id: 'p3', name: '王德福', sex: '男', age: 58, bed: '15床',
    admission: 'ZY20260520032', dx: '肝硬化（Child-Pugh B级）',
    status: 'offline', group: 'historical', surgeryType: '已出院',
    initialMsgs: [
      { type:'doctor', text:'王德福酒精性肝硬化，Child-Pugh B级，出现腹水。请AI评估治疗方案。', time:'昨天 15:10' },
      { type:'ai', text:'<div class="ai-conclusion">Child-Pugh B级，存在腹水，需注意门脉高压并发症。</div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① 限钠利尿治疗<br>② 监测肝肾功能、凝血<br>③ 定期腹水评估<br>④ 戒酒教育</div></div>', time:'昨天 15:13', actions:true },
    ],
    pushSequence: [
      { type:'lab', text:'ALT 68↑ (参考值 <40)\nAST 55↑ (参考值 <40)\nTBil 32.5↑ (参考值 <21)\nALB 28↓ (参考值 35-55)\nPT 15.2s↑ (参考值 10-14)', time:'09:20' },
      { type:'ai', text:'<div class="ai-conclusion">转氨酶轻度升高、白蛋白降低、凝血异常，符合肝硬化失代偿期。</div><div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">• ALB 28↓，需补充白蛋白<br>• PT 15.2s↑，凝血功能异常<br>• 腹水可能加重</div></div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① 加强利尿剂治疗<br>② 补充白蛋白<br>③ 复查腹水超声评估量变</div></div>', time:'09:23', actions:true },
    ],
    record: '<div class="section-title">病程记录</div>\n\n患者：王德福，男，58岁，15床\n日期：2026-05-27\n\n<div class="section-title">今日病情</div>\n酒精性肝硬化Child-Pugh B级，腹水存在。\n\n<div class="section-title">辅助检查</div>\n• ALT 68 U/L↑\n• TBil 32.5 μmol/L↑\n• ALB 28 g/L↓\n• PT 15.2s↑\n\n<div class="section-title">诊疗计划</div>\n1. 限钠利尿\n2. 补充白蛋白\n3. 监测腹水变化',
    orders: [
      { name:'呋塞米 20mg qd', detail:'利尿治疗' },
      { name:'螺内酯 100mg qd', detail:'保钾利尿' },
      { name:'人血白蛋白 10g', detail:'静脉补充' },
      { name:'腹水超声', detail:'评估量变' },
    ],
    consult: [
      { dept:'消化科', content:'Child-Pugh B级，限钠利尿，补充白蛋白。' },
      { dept:'药学部', content:'注意利尿剂剂量，避免过度利尿致肝性脑病。' },
    ],
    trends: { wbc:[3.8,4.0,3.9,4.2,4.1,4.3,4.0], crp:[2,3,2,4,3,5,4], neut:[52,50,51,53,52,54,51] },
    drg: { group:'肝硬化（M17）', weight:1.28, estimatedCost:15000, usedCost:6800, risk:'低', suggestions:['当前治疗方案合理','注意白蛋白补充频率','建议定期评估Child-Pugh分级'] }
  },
  {
    id: 'p4', name: '赵淑华', sex: '女', age: 70, bed: '6床',
    admission: 'ZY20260525041', dx: '慢性心衰急性加重',
    status: 'online', group: 'pre-op', surgeryType: '待评估',
    initialMsgs: [
      { type:'doctor', text:'赵淑华慢性心衰急性加重，下肢水肿加重3天，请AI评估。', time:'10:45' },
      { type:'ai', text:'<div class="ai-conclusion">70岁女性，慢性心衰急性失代偿，下肢水肿加重。</div><div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">• 需警惕肺水肿<br>• 建议BNP/NT-proBNP检测</div></div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① BNP/NT-proBNP检测<br>② 胸部X光排查肺水肿<br>③ 调整利尿剂<br>④ 监测体重</div></div>', time:'10:48', actions:true },
    ],
    pushSequence: [
      { type:'lab', text:'BNP 1250↑↑ (参考值 <100)\nNT-proBNP 8500↑↑ (参考值 <900)\n体重较入院增加2.3kg\n下肢水肿(++)', time:'13:00' },
      { type:'ai', text:'<div class="ai-conclusion">BNP和NT-proBNP显著升高，提示心衰失代偿。</div><div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">• BNP 1250↑↑，心衰指标显著升高<br>• 体重增加2.3kg，对应液体潴留<br>• 下肢水肿(++)</div></div><div class="ai-risk">⚠️ 需警惕急性肺水肿发生！</div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① 加强利尿（静脉呋塞米）<br>② 严格限钠限水<br>③ 每日监测体重<br>④ 评估是否需要正性肌力药物</div></div>', time:'13:03', actions:true, isRisk:true },
    ],
    record: '<div class="section-title">病程记录</div>\n\n患者：赵淑华，女，70岁，6床\n日期：2026-05-27\n\n<div class="section-title">今日病情</div>\n慢性心衰急性加重，下肢水肿加重3天。\n\n<div class="section-title">辅助检查</div>\n• BNP 1250 pg/mL↑↑\n• NT-proBNP 8500 pg/mL↑↑\n• 体重增加2.3kg\n• 下肢水肿(++)\n\n<div class="section-title">诊疗计划</div>\n1. 静脉呋塞米加强利尿\n2. 严格限钠限水\n3. 监测肺水肿风险',
    orders: [
      { name:'呋塞米 40mg iv', detail:'静脉加强利尿' },
      { name:'硝酸甘油泵入', detail:'减轻心脏负荷' },
      { name:'胸部X光', detail:'排查肺水肿' },
      { name:'体重监测 qd', detail:'评估液体潴留' },
    ],
    consult: [
      { dept:'心内科', content:'急性心衰失代偿，静脉呋塞米+硝酸甘油。' },
      { dept:'呼吸科', content:'警惕肺水肿，监测呼吸频率+SpO2。' },
    ],
    trends: { wbc:[5.0,5.2,5.1,5.3,5.2,5.4,5.1], crp:[3,4,3,5,4,6,5], neut:[55,54,56,53,55,54,55] },
    drg: { group:'慢性心衰（M14）', weight:1.65, estimatedCost:22000, usedCost:9500, risk:'中', suggestions:['密切监测BNP变化趋势','注意利尿剂抵抗风险','建议心内科随访调整方案'] }
  },
  {
    id: 'p5', name: '刘长生', sex: '男', age: 80, bed: '22床',
    admission: 'ZY20260524019', dx: 'COPD急性加重 | 前列腺增生',
    status: 'has-msg', group: 'post-op', surgeryType: '前列腺电切术后第5天',
    initialMsgs: [
      { type:'doctor', text:'刘长生COPD急性加重期入院，伴有排尿困难。请AI评估综合治疗方案。', time:'昨天 16:20' },
      { type:'ai', text:'<div class="ai-conclusion">80岁男性，COPD急性加重(GOLD III) + 前列腺增生。</div><div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">• 需避免加重排尿困难的药物<br>• 需评估呼吸功能</div></div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① 支气管扩张剂+氧疗<br>② 评估是否需要无创通气<br>③ 前列腺增生药物调整<br>④ 监测血气分析</div></div>', time:'昨天 16:23', actions:true },
    ],
    pushSequence: [
      { type:'nurse', text:'SpO2 88%↓ (参考值 ≥95%)\n呼吸频率 26次/分↑ (参考值 12-20)\nHR 102↑ (参考值 60-100)\nBP 145/85', time:'15:00' },
      { type:'ai', text:'<div class="ai-conclusion">血氧饱和度降至88%，呼吸频率增快，提示COPD急性加重合并呼吸功能不全。</div><div class="ai-risk">⚠️ 需警惕Ⅱ型呼吸衰竭！</div><div class="ai-section"><div class="ai-section-title">紧急建议</div><div class="ai-section-content">① 立即给予氧疗（2-4L/min）<br>② 评估是否需要无创正压通气<br>③ 动脉血气分析<br>④ 加强支气管扩张剂治疗</div></div>', time:'15:03', actions:true, isRisk:true },
      { type:'family', text:'刘长生说今晚排尿不太顺畅，尿量比平时少。麻烦医生看看。\n\n家属反馈时间: 14:40', time:'14:40' },
      { type:'ai', text:'<div class="ai-conclusion">排尿困难需关注。</div><div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">• COPD急性加重可导致缺氧加重前列腺充血<br>• 部分COPD药物可能影响排尿</div></div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① 检查膀胱残余尿量<br>② 必要时留置导尿<br>③ 调整前列腺增生药物<br>④ 监测肾功能</div></div>', time:'15:06', actions:true },
    ],
    record: '<div class="section-title">病程记录</div>\n\n患者：刘长生，男，80岁，22床\n日期：2026-05-27\n\n<div class="section-title">今日病情</div>\nCOPD急性加重(GOLD III)，伴排尿困难。\n\n<div class="section-title">辅助检查</div>\n• SpO2 88%↓\n• 呼吸频率 26次/分↑\n• HR 102次/分↑\n\n<div class="section-title">诊疗计划</div>\n1. 氧疗 + 支气管扩张剂\n2. 评估无创通气\n3. 处理排尿困难',
    orders: [
      { name:'氧疗 2-4L/min', detail:'持续低流量吸氧' },
      { name:'沙丁胺醇雾化 q6h', detail:'支气管扩张' },
      { name:'动脉血气分析', detail:'评估呼吸功能' },
      { name:'膀胱残余尿量', detail:'评估排尿困难' },
      { name:'坦索罗辛 0.2mg qd', detail:'前列腺增生' },
    ],
    consult: [
      { dept:'呼吸科', content:'COPD急性加重，氧疗+支气管扩张剂，评估无创通气。' },
      { dept:'泌尿外科', content:'排尿困难，检查残余尿量，必要时导尿。' },
    ],
    trends: { wbc:[6.5,7.2,8.0,9.5,10.8,11.5,12.0], crp:[5,8,15,28,38,45,52], neut:[58,62,68,74,78,82,84] },
    drg: { group:'COPD急性加重（M16）', weight:1.55, estimatedCost:20000, usedCost:7800, risk:'低', suggestions:['当前治疗方案合理','注意氧疗浓度控制','建议48小时后评估呼吸功能'] }
  },
];