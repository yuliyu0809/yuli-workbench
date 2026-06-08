import { Cloud, CloudOff, DownloadCloud, LogOut, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../Button.jsx';
import { Field, Input } from '../Field.jsx';

export function CloudSyncPanel({ sync }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!sync.configured) {
    return (
      <div className="rounded-3xl border border-[#ffd6c2] bg-[#fff7f1] p-4 text-sm text-muted">
        <div className="flex items-center gap-2 font-semibold text-ink"><CloudOff size={16} />本地模式</div>
        <p className="mt-2 leading-6">Supabase 尚未配置。当前数据继续保存在本机 LocalStorage；配置云端后可登录并同步店铺商品档案。</p>
      </div>
    );
  }

  if (!sync.user) {
    return (
      <div className="rounded-3xl border border-white/70 bg-white/60 p-4">
        <div className="flex items-center gap-2 font-semibold text-ink"><Cloud size={16} />云同步登录</div>
        <div className="mt-4 grid grid-cols-[1fr_1fr_auto_auto] gap-3">
          <Field label="邮箱"><Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></Field>
          <Field label="密码"><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 位" /></Field>
          <div className="flex items-end"><Button onClick={() => sync.signIn(email, password)} disabled={!email || !password}>登录</Button></div>
          <div className="flex items-end"><Button variant="soft" onClick={() => sync.signUp(email, password)} disabled={!email || !password}>注册</Button></div>
        </div>
        <div className="mt-3 text-sm text-muted">状态：{sync.status}{sync.errorMessage ? `，${sync.errorMessage}` : ''}</div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#bfe8cf] bg-[#f0fbf4] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-semibold text-ink"><Cloud size={16} />云同步模式</div>
          <div className="mt-1 text-sm text-muted">账号：{sync.user.email}；状态：{sync.status}{sync.lastSyncedAt ? `；最近同步：${sync.lastSyncedAt}` : ''}</div>
          {sync.errorMessage ? <div className="mt-1 text-sm text-[#b93f3f]">{sync.errorMessage}</div> : null}
        </div>
        <div className="flex gap-2">
          <Button variant="soft" onClick={() => sync.pullFromCloud()}><DownloadCloud size={15} />拉取云端</Button>
          <Button variant="soft" onClick={() => sync.pushToCloud()}><UploadCloud size={15} />上传本地</Button>
          <Button variant="ghost" onClick={() => sync.signOut()}><LogOut size={15} />退出</Button>
        </div>
      </div>
    </div>
  );
}