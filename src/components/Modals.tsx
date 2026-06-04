import { useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay open"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function MedicalRecordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="住院病历预览">
      <div className="record-preview">
        <div className="section-title">入院记录</div>
        <div>病历内容将在此显示...</div>
      </div>
      <div className="modal-actions">
        <button className="modal-btn" onClick={onClose}>取消</button>
        <button className="modal-btn">修改</button>
        <button className="modal-btn primary">确认提交</button>
      </div>
    </Modal>
  );
}

export function MedicalOrderModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="检查/医嘱建议">
      <div className="order-preview">
        <div className="order-item">
          <div className="order-name">医嘱项目</div>
          <div className="order-detail">医嘱详情...</div>
        </div>
      </div>
      <div className="modal-actions">
        <button className="modal-btn" onClick={onClose}>取消</button>
        <button className="modal-btn">修改</button>
        <button className="modal-btn primary">确认提交</button>
      </div>
    </Modal>
  );
}

export function ConsultModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="多学科联合会诊意见">
      <div className="consult-detail">
        <div className="consult-dept">会诊科室</div>
        <div className="consult-content">会诊意见内容...</div>
      </div>
      <div className="modal-actions">
        <button className="modal-btn" onClick={onClose}>关闭</button>
        <button className="modal-btn primary">确认执行</button>
      </div>
    </Modal>
  );
}

export function TrendModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="检验指标趋势图">
      <div className="trend-chart" style={{ height: 260, background: '#f8fafc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        趋势图表将在此显示
      </div>
      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
        近7日 WBC / CRP / NEUT% 变化趋势
      </p>
    </Modal>
  );
}

export function HandoverModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="交班摘要">
      <div className="record-preview">
        <div>交班摘要内容将在此显示...</div>
      </div>
      <div className="modal-actions">
        <button className="modal-btn" onClick={onClose}>关闭</button>
        <button className="modal-btn">导出</button>
        <button className="modal-btn primary">确认发送</button>
      </div>
    </Modal>
  );
}

export function DRGModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="DRG/DIP 分析">
      <div className="record-preview">
        <div>DRG分析内容将在此显示...</div>
      </div>
      <div className="modal-actions">
        <button className="modal-btn" onClick={onClose}>关闭</button>
      </div>
    </Modal>
  );
}

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI助手设置">
      <div className="setting-group">
        <div className="setting-group-title">基础设置</div>
        <div className="setting-row">
          <span className="setting-label">助手称呼</span>
          <input className="setting-input" defaultValue="小医" />
        </div>
        <div className="setting-row">
          <span className="setting-label">头像</span>
          <div className="setting-control">
            <div className="setting-opt selected">🤖</div>
            <div className="setting-opt">👨‍⚕️</div>
            <div className="setting-opt">🧠</div>
          </div>
        </div>
      </div>
      
      <div className="setting-group">
        <div className="setting-group-title">沟通风格</div>
        <div className="setting-row">
          <span className="setting-label">语气</span>
          <div className="setting-control">
            <div className="setting-opt selected">严谨</div>
            <div className="setting-opt">温和</div>
            <div className="setting-opt">简洁</div>
          </div>
        </div>
      </div>
      
      <div className="modal-actions">
        <button className="modal-btn" onClick={onClose}>取消</button>
        <button className="modal-btn primary">保存设置</button>
      </div>
    </Modal>
  );
}

export function AccountModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="账号管理">
      <div className="account-tabs">
        <div 
          className={`account-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          个人信息
        </div>
        <div 
          className={`account-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          个人设置
        </div>
        <div 
          className={`account-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          安全设置
        </div>
      </div>
      
      {activeTab === 'profile' && (
        <div className="account-panel active">
          <div className="profile-header">
            <div className="profile-avatar">孙</div>
            <div className="profile-info">
              <h4>孙医生</h4>
              <p>住院医师 | 神经内科</p>
            </div>
          </div>
          <div className="setting-row-inline">
            <span className="setting-label-inline">工号</span>
            <span className="setting-value-inline">DOC-2024001</span>
          </div>
          <div className="setting-row-inline">
            <span className="setting-label-inline">科室</span>
            <span className="setting-value-inline">神经内科</span>
          </div>
        </div>
      )}
      
      {activeTab === 'settings' && (
        <div className="account-panel active">
          <div className="setting-group">
            <div className="setting-group-title">界面设置</div>
            <div className="setting-row">
              <span className="setting-label">字体大小</span>
              <div className="setting-control">
                <div className="setting-opt">小</div>
                <div className="setting-opt selected">中</div>
                <div className="setting-opt">大</div>
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="modal-btn" onClick={onClose}>取消</button>
            <button className="modal-btn primary">保存设置</button>
          </div>
        </div>
      )}
      
      {activeTab === 'security' && (
        <div className="account-panel active">
          <div className="setting-group">
            <div className="setting-group-title">修改密码</div>
            <div className="login-field">
              <label>当前密码</label>
              <input type="password" placeholder="请输入当前密码" />
            </div>
            <div className="login-field">
              <label>新密码</label>
              <input type="password" placeholder="请输入新密码" />
            </div>
            <button className="modal-btn primary" style={{ width: '100%', marginTop: 8 }}>
              修改密码
            </button>
          </div>
          <button className="logout-btn">退出登录</button>
        </div>
      )}
    </Modal>
  );
}
