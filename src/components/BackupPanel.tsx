import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { audit } from '../utils/auditLogger';

interface BackupRecord {
  date: string;
  filename: string;
  size: number;
}

export default function BackupPanel({ onClose }: { onClose: () => void }) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>([]);
  const [lastBackupDays, setLastBackupDays] = useState<number | null>(null);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('backup_history') || '[]');
    setBackupHistory(history);
    if (history.length > 0) {
      const lastDate = new Date(history[0].date);
      const days = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      setLastBackupDays(days);
    }
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await invoke<string>('export_backup');
      
      // 使用 Tauri dialog 保存文件
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const filename = `zyai-backup-${dateStr}.json`;
      
      const filePath = await save({
        defaultPath: filename,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });

      if (filePath) {
        await writeTextFile(filePath, data);
        
        // 记录备份历史
        const record: BackupRecord = {
          date: now.toISOString(),
          filename,
          size: data.length,
        };
        const history = [record, ...backupHistory].slice(0, 10);
        localStorage.setItem('backup_history', JSON.stringify(history));
        setBackupHistory(history);
        setLastBackupDays(0);
        
        audit.exportBackup();
        alert('备份导出成功！');
      }
    } catch (e) {
      console.error('Export failed:', e);
      // Fallback: 使用浏览器下载
      try {
        const data = await invoke<string>('export_backup');
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        a.download = `zyai-backup-${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
        audit.exportBackup();
        alert('备份导出成功！');
      } catch (e2) {
        console.error('Fallback export failed:', e2);
        alert('导出备份失败');
      }
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!confirm('⚠️ 导入将覆盖当前数据，是否继续？\n\n建议在导入前先导出当前数据作为备份。')) {
      return;
    }

    setImporting(true);
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readTextFile } = await import('@tauri-apps/plugin-fs');
      
      const filePath = await open({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        multiple: false,
      });

      if (filePath && typeof filePath === 'string') {
        const data = await readTextFile(filePath);
        const result = await invoke<string>('import_backup', { data });
        audit.importBackup();
        alert(result || '导入成功！页面将刷新。');
        window.location.reload();
      }
    } catch (e) {
      console.error('Import failed:', e);
      // Fallback: 使用文件 input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (ev: any) => {
        const file = ev.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const data = reader.result as string;
            const result = await invoke<string>('import_backup', { data });
            audit.importBackup();
            alert(result || '导入成功！页面将刷新。');
            window.location.reload();
          } catch (e2) {
            console.error('Fallback import failed:', e2);
            alert('导入备份失败');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width: 480 }}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3 style={{ margin: '0 0 20px' }}>💾 数据备份与恢复</h3>

        {/* 备份提醒 */}
        {lastBackupDays !== null && lastBackupDays >= 7 && (
          <div style={{
            padding: '10px 14px', marginBottom: 16, background: '#fef3c7', border: '1px solid #fbbf24',
            borderRadius: 6, fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <strong>备份提醒</strong>
              <div style={{ marginTop: 2 }}>您已 {lastBackupDays} 天未备份数据，建议立即导出备份。</div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button
            className="modal-btn primary"
            onClick={handleExport}
            disabled={exporting}
            style={{ flex: 1, padding: '12px 16px' }}
          >
            {exporting ? '导出中...' : '📤 导出备份'}
          </button>
          <button
            className="modal-btn"
            onClick={handleImport}
            disabled={importing}
            style={{ flex: 1, padding: '12px 16px' }}
          >
            {importing ? '导入中...' : '📥 导入备份'}
          </button>
        </div>

        {/* 说明 */}
        <div style={{ padding: 12, background: '#f1f5f9', borderRadius: 6, marginBottom: 16, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
          <strong>导出说明：</strong>将所有患者数据、会话记录、会诊记录等导出为 JSON 文件。<br />
          <strong>导入说明：</strong>从备份文件恢复数据。导入将覆盖当前所有数据。
        </div>

        {/* 备份历史 */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>📋 备份历史</h4>
          {backupHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>
              暂无备份记录
            </div>
          ) : (
            <div style={{ maxHeight: 200, overflow: 'auto' }}>
              {backupHistory.map((record, i) => (
                <div key={i} style={{
                  padding: '8px 12px', marginBottom: 6, background: '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{record.filename}</div>
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                      {new Date(record.date).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>
                    {(record.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="modal-btn" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}
