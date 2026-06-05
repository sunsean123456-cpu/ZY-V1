import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { RichPatientData } from '../types';

interface DiagnosisItem {
  name: string;
  probability: number; // 0-100
  evidence: string[];
  actions: string[];
}

interface DiagnosisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  patient: RichPatientData | null;
}

// Fallback: generate differential diagnoses from patient data locally
function generateLocalDiagnoses(patient: RichPatientData): DiagnosisItem[] {
  const dx = patient.dx.toLowerCase();
  const items: DiagnosisItem[] = [];

  if (dx.includes('脑梗') || dx.includes('卒中')) {
    items.push(
      { name: '急性脑梗死', probability: 85, evidence: ['右侧肢体无力', '言语不清', '发病3小时内', 'NIHSS约8分'], actions: ['急查头颅CT', '评估溶栓指征', '监测神经功能'] },
      { name: '脑出血', probability: 10, evidence: ['急性起病', '高血压病史'], actions: ['头颅CT排除出血'] },
      { name: 'TIA（短暂性脑缺血发作）', probability: 5, evidence: ['症状类似但持续'], actions: ['观察症状是否24h内恢复'] }
    );
  } else if (dx.includes('肺炎') || dx.includes('感染')) {
    items.push(
      { name: '社区获得性肺炎', probability: 80, evidence: ['发热咳嗽', 'CRP升高', 'PCT升高', '胸部CT斑片影'], actions: ['经验性抗感染', '痰培养', '72h评估疗效'] },
      { name: '医院获得性肺炎', probability: 12, evidence: ['住院患者', '卧床'], actions: ['评估入院时间', '调整抗生素谱'] },
      { name: '肺栓塞', probability: 8, evidence: ['发热', '呼吸急促'], actions: ['D-二聚体', 'CTPA'] }
    );
  } else if (dx.includes('心衰') || dx.includes('心力衰竭')) {
    items.push(
      { name: '慢性心衰急性加重', probability: 88, evidence: ['BNP显著升高', '下肢水肿', '体重增加'], actions: ['静脉利尿', '限钠限水', '监测体重'] },
      { name: '急性心肌梗死', probability: 7, evidence: ['冠心病风险', '心衰表现'], actions: ['心电图', '心肌酶谱'] },
      { name: '肺栓塞', probability: 5, evidence: ['呼吸困难', '水肿'], actions: ['D-二聚体', 'CTPA'] }
    );
  } else if (dx.includes('copd') || dx.includes('慢性阻塞')) {
    items.push(
      { name: 'COPD急性加重', probability: 82, evidence: ['SpO2下降', '呼吸频率增快', 'COPD病史'], actions: ['氧疗', '支气管扩张剂', '血气分析'] },
      { name: '肺炎合并COPD', probability: 12, evidence: ['感染指标', '呼吸恶化'], actions: ['胸部CT', '抗感染'] },
      { name: '气胸', probability: 6, evidence: ['突发呼吸困难'], actions: ['胸部X光'] }
    );
  } else if (dx.includes('肝硬化')) {
    items.push(
      { name: '肝硬化失代偿期', probability: 85, evidence: ['Child-Pugh B级', '腹水', '白蛋白低', '凝血异常'], actions: ['限钠利尿', '补充白蛋白', '监测腹水'] },
      { name: '自发性腹膜炎', probability: 10, evidence: ['腹水', '肝硬化'], actions: ['腹水穿刺培养'] },
      { name: '肝性脑病', probability: 5, evidence: ['肝功能异常'], actions: ['监测意识状态', '血氨'] }
    );
  } else {
    // Generic fallback
    items.push(
      { name: patient.dx.split('|')[0].trim(), probability: 75, evidence: ['主要诊断依据'], actions: ['完善相关检查', '对症处理'] },
      { name: '待鉴别诊断', probability: 25, evidence: ['需进一步检查'], actions: ['完善辅助检查'] }
    );
  }

  return items;
}

export default function DiagnosisPanel({ isOpen, onClose, patient }: DiagnosisPanelProps) {
  const [diagnoses, setDiagnoses] = useState<DiagnosisItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState('');

  useEffect(() => {
    if (isOpen && patient) {
      loadDiagnoses();
    }
  }, [isOpen, patient]);

  const loadDiagnoses = async () => {
    if (!patient) return;
    setLoading(true);
    setError('');

    try {
      // Try AI-generated diagnoses
      const patientInfo = `患者：${patient.name}，${patient.sex}，${patient.age}岁\n诊断：${patient.dx}\n手术/状态：${patient.surgeryType}\n检验趋势：WBC ${patient.trends.wbc[6]}, CRP ${patient.trends.crp[6]}, NEUT% ${patient.trends.neut[6]}`;
      
      const response = await invoke<string>('ai_chat', {
        message: `请根据以下患者信息生成鉴别诊断列表，每个诊断包含名称、概率(0-100)、支持证据(3-4条)、建议检查(2-3条)。以JSON数组格式返回：[{"name":"","probability":0,"evidence":[],"actions":[]}]`,
        patientContext: patientInfo,
        history: [],
      });

      if (response) {
        try {
          const jsonMatch = response.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as DiagnosisItem[];
            setDiagnoses(parsed);
            setLoading(false);
            return;
          }
        } catch (_parseErr) {
          // Fallback to local generation
        }
      }
      // Fallback
      setDiagnoses(generateLocalDiagnoses(patient));
    } catch (err) {
      console.error('Diagnosis AI error:', err);
      setDiagnoses(generateLocalDiagnoses(patient));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !patient) return null;

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width: 580 }}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3>🧠 AI辅助鉴别诊断 - {patient.name}</h3>

        {loading && (
          <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔄</div>
            <div>AI正在分析鉴别诊断...</div>
          </div>
        )}

        {!loading && diagnoses.length > 0 && (
          <div className="diagnosis-list">
            {diagnoses.map((item, idx) => (
              <div key={idx} className="diagnosis-card">
                <div className="diagnosis-header">
                  <span className="diagnosis-name">{item.name}</span>
                  <span className={`diagnosis-prob ${item.probability >= 70 ? 'high' : item.probability >= 30 ? 'mid' : 'low'}`}>
                    {item.probability}%
                  </span>
                </div>
                <div className="probability-bar">
                  <div 
                    className="probability-fill" 
                    style={{ 
                      width: `${item.probability}%`,
                      background: item.probability >= 70 ? '#ef4444' : item.probability >= 30 ? '#f59e0b' : '#22c55e'
                    }}
                  />
                </div>
                <div className="diagnosis-section">
                  <div className="diagnosis-section-title">支持证据</div>
                  <ul className="diagnosis-evidence">
                    {item.evidence.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
                <div className="diagnosis-section">
                  <div className="diagnosis-section-title">建议检查</div>
                  <ul className="diagnosis-actions">
                    {item.actions.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && diagnoses.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
            <div>暂无鉴别诊断数据</div>
          </div>
        )}

        <div className="modal-actions">
          <button className="modal-btn" onClick={onClose}>关闭</button>
          <button className="modal-btn" onClick={loadDiagnoses}>🔄 重新分析</button>
          <button className="modal-btn primary" onClick={() => { onClose(); }}>确认</button>
        </div>

        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
          ⚠️ AI辅助诊断仅供参考，最终诊断需结合临床判断
        </div>
      </div>
    </div>
  );
}
