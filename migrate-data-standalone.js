#!/usr/bin/env node
/**
 * v9.0 数据迁移脚本（独立版本）
 * 直接操作 SQLite 数据库，将 mock 数据写入
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取 mock 数据
const patientDataPath = join(__dirname, 'src/data/patientData.ts');
const patientDataContent = readFileSync(patientDataPath, 'utf-8');

// 简单解析 TypeScript 数据（实际使用时可以改用 ts-node）
// 这里我们直接硬编码数据，因为 TypeScript 文件不能直接 import
const patientsData = [
  {
    id: 'p1', name: '张建国', sex: '男', age: 72, bed: '12床',
    admission: 'ZY20260527008', dx: '急性脑梗死 | 2型糖尿病 | 高血压',
    status: 'has-msg', group: 'pre-op', surgeryType: '待评估',
    initialMsgs: [
      { type:'doctor', text:'张建国患者今日新入院，右侧肢体无力伴言语不清3小时，既往高血压糖尿病史。请AI评估溶栓指征。', time:'09:35' },
      { type:'ai', text:'<div class="ai-conclusion">患者72岁男性，发病3小时，NIHSS约8分，在溶栓时间窗内。</div>', time:'09:38', actions:true },
      { type:'doctor', text:'已开具头颅CT和凝血功能检查。家属反映今早头晕。', time:'10:02' },
    ],
    pushSequence: [
      { type:'lab', text:'WBC 12.3↑\nCRP 45↑\nNEUT% 85.2↑', time:'14:32' },
      { type:'ai', text:'<div class="ai-conclusion">WBC和CRP显著升高，提示感染/炎症反应。</div>', time:'14:34', actions:true },
    ],
    record: '<div class="section-title">入院记录</div>\n\n患者姓名：张建国  性别：男  年龄：72岁',
    orders: [
      { name:'头颅CT平扫', detail:'急诊，排除脑出血' },
      { name:'凝血功能+血常规', detail:'评估溶栓条件' },
    ],
    consult: [
      { dept:'神经内科', content:'建议溶栓治疗，NIHSS 8分，获益大于风险。' },
      { dept:'心内科', content:'合并糖尿病+高血压，注意血压管理。' },
    ],
    trends: { wbc:[4.2,5.1,6.8,8.5,10.2,11.8,12.3], crp:[2,5,12,22,32,40,45], neut:[55,60,68,72,78,82,85.2] },
    drg: { group:'急性脑梗死（M13）', weight:1.85, estimatedCost:28500, usedCost:12300, risk:'低', suggestions:['当前治疗方案在医保额度内','注意控制抗生素使用天数'] }
  },
  {
    id: 'p2', name: '李秀英', sex: '女', age: 65, bed: '8床',
    admission: 'ZY20260526015', dx: '肺炎 | 冠心病',
    status: 'online', group: 'post-op', surgeryType: '阑尾切除术后第3天',
    initialMsgs: [
      { type:'doctor', text:'李秀英因发热咳嗽3天入院，既往冠心病史，请AI评估感染严重程度。', time:'08:20' },
      { type:'ai', text:'<div class="ai-conclusion">65岁女性，社区获得性肺炎可能性大。</div>', time:'08:23', actions:true },
    ],
    pushSequence: [
      { type:'lab', text:'体温 38.5℃↑\nCRP 78↑↑\nPCT 2.1↑\nWBC 14.5↑', time:'10:10' },
      { type:'ai', text:'<div class="ai-conclusion">CRP明显升高、PCT 2.1提示细菌感染可能性大。</div>', time:'10:12', actions:true },
    ],
    record: '<div class="section-title">病程记录</div>\n\n患者：李秀英，女，65岁，8床',
    orders: [
      { name:'头孢曲松 2g qd', detail:'经验性抗感染' },
      { name:'氨溴索 30mg tid', detail:'祛痰' },
    ],
    consult: [
      { dept:'呼吸科', content:'社区获得性肺炎，建议头孢曲松+阿奇霉素联合治疗。' },
      { dept:'心内科', content:'冠心病史，避免氟喹诺酮类，监测心电图。' },
    ],
    trends: { wbc:[4.0,5.5,7.2,9.8,12.1,13.8,14.5], crp:[1,3,8,25,45,65,78], neut:[50,55,62,68,74,79,82] },
    drg: { group:'肺炎（M15）', weight:1.42, estimatedCost:18500, usedCost:8200, risk:'低', suggestions:['当前治疗方案合理','注意抗生素使用天数'] }
  },
  {
    id: 'p3', name: '王德福', sex: '男', age: 58, bed: '15床',
    admission: 'ZY20260520032', dx: '肝硬化（Child-Pugh B级）',
    status: 'offline', group: 'historical', surgeryType: '已出院',
    initialMsgs: [
      { type:'doctor', text:'王德福酒精性肝硬化，Child-Pugh B级，出现腹水。请AI评估治疗方案。', time:'昨天 15:10' },
      { type:'ai', text:'<div class="ai-conclusion">Child-Pugh B级，存在腹水，需注意门脉高压并发症。</div>', time:'昨天 15:13', actions:true },
    ],
    pushSequence: [
      { type:'lab', text:'ALT 68↑\nAST 55↑\nTBil 32.5↑\nALB 28↓', time:'09:20' },
      { type:'ai', text:'<div class="ai-conclusion">转氨酶轻度升高、白蛋白降低、凝血异常，符合肝硬化失代偿期。</div>', time:'09:23', actions:true },
    ],
    record: '<div class="section-title">病程记录</div>\n\n患者：王德福，男，58岁，15床',
    orders: [
      { name:'呋塞米 20mg qd', detail:'利尿治疗' },
      { name:'螺内酯 100mg qd', detail:'保钾利尿' },
    ],
    consult: [
      { dept:'消化科', content:'Child-Pugh B级，限钠利尿，补充白蛋白。' },
      { dept:'药学部', content:'注意利尿剂剂量，避免过度利尿致肝性脑病。' },
    ],
    trends: { wbc:[3.8,4.0,3.9,4.2,4.1,4.3,4.0], crp:[2,3,2,4,3,5,4], neut:[52,50,51,53,52,54,51] },
    drg: { group:'肝硬化（M17）', weight:1.28, estimatedCost:15000, usedCost:6800, risk:'低', suggestions:['当前治疗方案合理','注意白蛋白补充频率'] }
  },
  {
    id: 'p4', name: '赵淑华', sex: '女', age: 70, bed: '6床',
    admission: 'ZY20260525041', dx: '慢性心衰急性加重',
    status: 'online', group: 'pre-op', surgeryType: '待评估',
    initialMsgs: [
      { type:'doctor', text:'赵淑华慢性心衰急性加重，下肢水肿加重3天，请AI评估。', time:'10:45' },
      { type:'ai', text:'<div class="ai-conclusion">70岁女性，慢性心衰急性失代偿，下肢水肿加重。</div>', time:'10:48', actions:true },
    ],
    pushSequence: [
      { type:'lab', text:'BNP 1250↑↑\nNT-proBNP 8500↑↑\n体重较入院增加2.3kg', time:'13:00' },
      { type:'ai', text:'<div class="ai-conclusion">BNP和NT-proBNP显著升高，提示心衰失代偿。</div>', time:'13:03', actions:true, isRisk:true },
    ],
    record: '<div class="section-title">病程记录</div>\n\n患者：赵淑华，女，70岁，6床',
    orders: [
      { name:'呋塞米 40mg iv', detail:'静脉加强利尿' },
      { name:'硝酸甘油泵入', detail:'减轻心脏负荷' },
    ],
    consult: [
      { dept:'心内科', content:'急性心衰失代偿，静脉呋塞米+硝酸甘油。' },
      { dept:'呼吸科', content:'警惕肺水肿，监测呼吸频率+SpO2。' },
    ],
    trends: { wbc:[5.0,5.2,5.1,5.3,5.2,5.4,5.1], crp:[3,4,3,5,4,6,5], neut:[55,54,56,53,55,54,55] },
    drg: { group:'慢性心衰（M14）', weight:1.65, estimatedCost:22000, usedCost:9500, risk:'中', suggestions:['密切监测BNP变化趋势','注意利尿剂抵抗风险'] }
  },
  {
    id: 'p5', name: '刘长生', sex: '男', age: 80, bed: '22床',
    admission: 'ZY20260524019', dx: 'COPD急性加重 | 前列腺增生',
    status: 'has-msg', group: 'post-op', surgeryType: '前列腺电切术后第5天',
    initialMsgs: [
      { type:'doctor', text:'刘长生COPD急性加重期入院，伴有排尿困难。请AI评估综合治疗方案。', time:'昨天 16:20' },
      { type:'ai', text:'<div class="ai-conclusion">80岁男性，COPD急性加重(GOLD III) + 前列腺增生。</div>', time:'昨天 16:23', actions:true },
    ],
    pushSequence: [
      { type:'nurse', text:'SpO2 88%↓\n呼吸频率 26次/分↑\nHR 102↑', time:'15:00' },
      { type:'ai', text:'<div class="ai-conclusion">血氧饱和度降至88%，呼吸频率增快，提示COPD急性加重合并呼吸功能不全。</div>', time:'15:03', actions:true, isRisk:true },
    ],
    record: '<div class="section-title">病程记录</div>\n\n患者：刘长生，男，80岁，22床',
    orders: [
      { name:'氧疗 2-4L/min', detail:'持续低流量吸氧' },
      { name:'沙丁胺醇雾化 q6h', detail:'支气管扩张' },
    ],
    consult: [
      { dept:'呼吸科', content:'COPD急性加重，氧疗+支气管扩张剂，评估无创通气。' },
      { dept:'泌尿外科', content:'排尿困难，检查残余尿量，必要时导尿。' },
    ],
    trends: { wbc:[6.5,7.2,8.0,9.5,10.8,11.5,12.0], crp:[5,8,15,28,38,45,52], neut:[58,62,68,74,78,82,84] },
    drg: { group:'COPD急性加重（M16）', weight:1.55, estimatedCost:20000, usedCost:7800, risk:'低', suggestions:['当前治疗方案合理','注意氧疗浓度控制'] }
  },
];

const dbPath = join(__dirname, 'src-tauri/hospital_ai.db');
console.log('数据库路径:', dbPath);

const db = new Database(dbPath);

try {
  console.log('开始迁移数据...');
  console.log(`共 ${patientsData.length} 个患者`);

  // 开启事务
  const migrate = db.transaction(() => {
    for (const patient of patientsData) {
      console.log(`\n迁移患者: ${patient.name} (${patient.id})`);

      // 插入患者
      const patientStmt = db.prepare(`
        INSERT OR REPLACE INTO patients 
        (id, name, bed_number, gender, age, diagnosis, admission_date, admission_no, status, group_type, surgery_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      patientStmt.run(
        patient.id,
        patient.name,
        patient.bed,
        patient.sex,
        patient.age,
        patient.dx,
        '2026-05-27',
        patient.admission,
        patient.status,
        patient.group,
        patient.surgeryType || ''
      );
      console.log(`  ✓ 患者基本信息`);

      // 插入会话
      const convId = `conv_${patient.id}`;
      const convStmt = db.prepare(`
        INSERT OR REPLACE INTO conversations (id, patient_id, title, created_at)
        VALUES (?, ?, ?, ?)
      `);
      convStmt.run(convId, patient.id, `患者${patient.name}的会话`, '2026-05-27 09:00:00');
      console.log(`  ✓ 会话`);

      // 插入初始消息
      const msgStmt = db.prepare(`
        INSERT OR REPLACE INTO messages 
        (id, conversation_id, role, content, msg_type, timestamp, has_actions, is_risk)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      patient.initialMsgs.forEach((m, i) => {
        const msgId = `init_${patient.id}_${i}`;
        msgStmt.run(
          msgId,
          convId,
          m.type === 'doctor' ? 'user' : 'assistant',
          m.text,
          m.type,
          m.time,
          m.actions ? 1 : 0,
          m.isRisk ? 1 : 0
        );
      });
      console.log(`  ✓ 初始消息 (${patient.initialMsgs.length} 条)`);

      // 插入推送消息
      patient.pushSequence.forEach((m, i) => {
        const msgId = `push_${patient.id}_${i}`;
        msgStmt.run(
          msgId,
          convId,
          m.type === 'doctor' ? 'user' : 'assistant',
          m.text,
          m.type,
          m.time,
          m.actions ? 1 : 0,
          m.isRisk ? 1 : 0
        );
      });
      console.log(`  ✓ 推送消息 (${patient.pushSequence.length} 条)`);

      // 插入病历
      const recordStmt = db.prepare(`
        INSERT OR REPLACE INTO medical_records (id, patient_id, record_type, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      recordStmt.run(`record_${patient.id}`, patient.id, 'admission', patient.record, '2026-05-27 09:00:00');
      console.log(`  ✓ 病历`);

      // 插入医嘱
      const orderStmt = db.prepare(`
        INSERT OR REPLACE INTO medical_orders (id, patient_id, order_type, content, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      patient.orders.forEach((o, i) => {
        orderStmt.run(
          `order_${patient.id}_${i}`,
          patient.id,
          o.name,
          o.detail,
          'pending',
          '2026-05-27 09:00:00'
        );
      });
      console.log(`  ✓ 医嘱 (${patient.orders.length} 条)`);

      // 插入会诊
      const consultStmt = db.prepare(`
        INSERT OR REPLACE INTO patient_consults (id, patient_id, dept, content)
        VALUES (?, ?, ?, ?)
      `);
      patient.consult.forEach((c, i) => {
        consultStmt.run(`consult_${patient.id}_${i}`, patient.id, c.dept, c.content);
      });
      console.log(`  ✓ 会诊 (${patient.consult.length} 条)`);

      // 插入趋势
      const trendStmt = db.prepare(`
        INSERT OR REPLACE INTO patient_trends (id, patient_id, wbc_data, crp_data, neut_data)
        VALUES (?, ?, ?, ?, ?)
      `);
      trendStmt.run(
        `trend_${patient.id}`,
        patient.id,
        JSON.stringify(patient.trends.wbc),
        JSON.stringify(patient.trends.crp),
        JSON.stringify(patient.trends.neut)
      );
      console.log(`  ✓ 检验趋势`);

      // 插入 DRG
      if (patient.drg) {
        const drgStmt = db.prepare(`
          INSERT OR REPLACE INTO patient_drg 
          (id, patient_id, drg_group, weight, estimated_cost, used_cost, risk, suggestions)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        drgStmt.run(
          `drg_${patient.id}`,
          patient.id,
          patient.drg.group,
          patient.drg.weight,
          patient.drg.estimatedCost,
          patient.drg.usedCost,
          patient.drg.risk,
          JSON.stringify(patient.drg.suggestions)
        );
        console.log(`  ✓ DRG 分组`);
      }

      console.log(`✓ 患者 ${patient.name} 迁移完成`);
    }
  });

  migrate();
  console.log('\n✅ 数据迁移完成！');

  // 验证
  const count = db.prepare('SELECT COUNT(*) as count FROM patients').get();
  console.log(`\n数据库中共 ${count.count} 个患者`);

} catch (error) {
  console.error('迁移失败:', error);
  process.exit(1);
} finally {
  db.close();
}
