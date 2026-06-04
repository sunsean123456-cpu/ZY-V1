import { useMemo } from 'react';
import { usePatientStore } from '../stores/patientStore';
import { useChatStore } from '../stores/chatStore';

interface WorkStats {
  totalPatients: number;
  preOpCount: number;
  postOpCount: number;
  criticalCount: number;
  pendingOrders: number;
  todayConversations: number;
}

export default function StatsPanel() {
  const { richPatients } = usePatientStore();
  const { messages } = useChatStore();

  const stats = useMemo<WorkStats>(() => {
    const patients = richPatients || [];
    const totalPatients = patients.length;
    const preOpCount = patients.filter(p => p.group === 'pre-op').length;
    const postOpCount = patients.filter(p => p.group === 'post-op').length;

    // Count critical/risk messages across all push sequences
    let criticalCount = 0;
    let pendingOrders = 0;
    patients.forEach(p => {
      criticalCount += p.pushSequence.filter(m => m.isRisk).length;
      pendingOrders += p.orders.length;
    });

    // Today's conversations = current messages count
    const todayConversations = messages.length;

    return { totalPatients, preOpCount, postOpCount, criticalCount, pendingOrders, todayConversations };
  }, [richPatients, messages]);

  const statItems = [
    { label: '在院患者', value: stats.totalPatients, icon: '🏥', color: '#3b82f6' },
    { label: '术前', value: stats.preOpCount, icon: '📋', color: '#f59e0b' },
    { label: '术后', value: stats.postOpCount, icon: '🩹', color: '#22c55e' },
    { label: '危急值', value: stats.criticalCount, icon: '⚠️', color: stats.criticalCount > 0 ? '#ef4444' : '#94a3b8' },
    { label: '待处理医嘱', value: stats.pendingOrders, icon: '📝', color: '#8b5cf6' },
    { label: '今日对话', value: stats.todayConversations, icon: '💬', color: '#06b6d4' },
  ];

  return (
    <div className="stats-panel">
      <div className="stats-panel-title">📊 今日统计</div>
      <div className="stats-grid">
        {statItems.map((item, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-icon" style={{ background: `${item.color}20`, color: item.color }}>
              {item.icon}
            </div>
            <div className="stat-value" style={{ color: item.color }}>{item.value}</div>
            <div className="stat-label">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
