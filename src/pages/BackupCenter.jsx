import { Download, Save } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { GlassPanel } from '../components/GlassPanel.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { downloadBackup } from '../utils/backupManager.js';

export function BackupCenter({ backups, onCreateBackup }) {
  function handleManualBackup() {
    onCreateBackup('manual');
  }

  return (
    <>
      <PageHeader
        eyebrow="Local Backup"
        title="备份中心"
        description="自动保存 Yuliの工作台的本地数据快照，包含产品、标题、提示词、利润记录和规则。最多保留最近 10 份。"
        action={<Button onClick={handleManualBackup}><Save size={16} />立即备份</Button>}
      />

      <div className="grid grid-cols-[0.75fr_1.25fr] gap-5">
        <GlassPanel>
          <h3 className="text-xl font-semibold text-ink">自动备份状态</h3>
          <p className="mt-3 text-sm leading-6 text-muted">
            当本地数据变化时，系统会自动写入一份浏览器本地快照。手动下载的 JSON 文件可长期保存到电脑。
          </p>
          <div className="mt-6 rounded-2xl bg-white/64 p-4">
            <div className="text-sm text-muted">当前备份数量</div>
            <div className="mt-2 text-4xl font-semibold text-ink">{backups.length}</div>
          </div>
          <div className="mt-4 rounded-2xl bg-[#fff7fa]/80 p-4 text-sm leading-6 text-muted">
            本地快照仍然依赖浏览器数据。重要资料建议定期点击下载，保存为 JSON 文件。
          </div>
        </GlassPanel>

        <GlassPanel>
          <h3 className="text-lg font-semibold text-ink">最近备份</h3>
          <div className="mt-4 space-y-3">
            {backups.length === 0 ? (
              <div className="rounded-2xl bg-white/64 p-4 text-sm text-muted">暂无备份记录。</div>
            ) : (
              backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white/64 px-4 py-3">
                  <div>
                    <div className="font-medium text-ink">{backup.createdAt}</div>
                    <div className="mt-1 text-xs text-muted">
                      {backup.reason === 'auto' ? '自动备份' : '手动备份'} · V{backup.version}
                    </div>
                  </div>
                  <Button variant="soft" onClick={() => downloadBackup(backup)}>
                    <Download size={15} />下载
                  </Button>
                </div>
              ))
            )}
          </div>
        </GlassPanel>
      </div>
    </>
  );
}
