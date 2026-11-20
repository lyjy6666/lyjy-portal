'use client';

import { useState } from 'react';
import { Upload, Download, LogIn, UserPlus, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { usePro } from '../../hooks/ProContext';
import { ProDialog } from '../common/bits';
import { buildExport, EXPORT_LABELS, parseImportText, type ExportFormat } from '../../core/importExport';
import { GradePicker, WeakSubjectPicker } from '../common/ProfilePickers';

export function BasicDialogs() {
  const {
    dialog, closeDialog, dialogPayload, login, register, user,
    importText, tasks, settings, setSettings, recycle, restoreFromRecycle, clearRecycle,
    offline,
  } = usePro();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  // 注册时顺便建档：年级 + 薄弱项，注册完立刻写进本地画像，AI 马上能用
  const [regGrade, setRegGrade] = useState('');
  const [regWeak, setRegWeak] = useState<string[]>([]);
  const [fileText, setFileText] = useState('');
  const [importError, setImportError] = useState('');

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setImportError('');
    try {
      let text = '';
      if (file.name.toLowerCase().endsWith('.docx')) {
        const mammoth = await import('mammoth');
        const buffer = await file.arrayBuffer();
        text = (await mammoth.extractRawText({ arrayBuffer: buffer })).value;
      } else {
        text = await file.text();
      }
      const parsed = parseImportText(text);
      if (parsed.error) { setImportError(parsed.error); setFileText(''); return; }
      setFileText(parsed.lines.join('\n'));
    } catch {
      setImportError('文件读取失败，请改用 .txt / .md / .docx');
      setFileText('');
    }
  };

  const doExport = (format: ExportFormat) => {
    const out = buildExport(format, tasks);
    if (out.print) {
      const win = window.open('', '_blank');
      if (!win) { toast.error('请允许弹出窗口'); return; }
      win.document.write(out.content);
      win.document.close();
      win.focus();
      window.setTimeout(() => win.print(), 400);
      return;
    }
    const blob = new Blob([out.content], { type: out.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = out.filename;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(`已导出 ${out.filename}`);
  };

  return (
    <>
      {/* 登录 / 注册 */}
      <ProDialog
        open={dialog === 'auth'}
        onOpenChange={(v) => { if (!v) closeDialog(); }}
        title="登录作业管理系统 Pro"
        desc="与原版共用同一套账号与云端数据；Pro 版重新登录一次即可启用更安全的签名凭证。"
        className="sm:max-w-[420px]"
      >
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (mode === 'register' && !regGrade) {
              toast.error('先选一下年级，AI 才能按年级推测用时');
              return;
            }
            const ok = mode === 'login' ? await login(username, password) : await register(username, password);
            if (!ok) return;
            if (mode === 'register') {
              setSettings({ ...settings, grade: regGrade, weakSubjects: regWeak });
              toast.success(`已建档：${regGrade}${regWeak.length ? ` · 薄弱 ${regWeak.join('/')}` : ''}`);
            }
            setPassword('');
            closeDialog();
          }}
        >
          <input className="hw-input" placeholder="用户名" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          <input className="hw-input" type="password" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />

          {mode === 'register' && (
            <div className="hw-panel space-y-2 p-3">
              <p className="hw-title text-sm">学习画像（注册即可建档）</p>
              <p className="hw-label">年级用于 AI 推测用时，薄弱项会让 AI 给这些科目多留时间。</p>
              <GradePicker value={regGrade} onChange={setRegGrade} dense />
              <WeakSubjectPicker value={regWeak} onChange={setRegWeak} />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="submit" className="hw-btn" data-variant="primary">
              {mode === 'login' ? <LogIn size={14} /> : <UserPlus size={14} />}
              {mode === 'login' ? '登录' : '注册'}
            </button>
            <button type="button" className="hw-btn" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              切换到{mode === 'login' ? '注册' : '登录'}
            </button>
            <a href="/homework" className="hw-chip ml-auto">去用原版</a>
          </div>
          <p className="hw-label">数据仍存在原来的云端库里，登录后新旧两版都能看到同一批作业。</p>
          {mode === 'login' && <p className="hw-label">年级与薄弱项可在「个人中心」随时修改。</p>}
          {offline && <p className="hw-label hw-overdue">当前离线，登录后只能查看本地缓存</p>}
        </form>
      </ProDialog>

      {/* 导入文档 */}
      <ProDialog
        open={dialog === 'import'}
        onOpenChange={(v) => { if (!v) { closeDialog(); setFileText(''); setImportError(''); } }}
        title="导入文档为作业"
        desc="支持 .txt / .md / .docx，按行拆成作业，最多 5000 字、200 行。"
        className="sm:max-w-[540px]"
      >
        <div className="space-y-3">
          <label className="hw-btn cursor-pointer w-fit">
            <Upload size={14} /> 选择文件
            <input type="file" accept=".txt,.md,.docx" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = ''; // 允许再次选择同一个文件
                void onFile(f);
              }} />
          </label>
          {importError && <p className="hw-overdue text-xs">{importError}</p>}
          <textarea
            className="hw-input min-h-40" rows={8}
            value={fileText}
            onChange={(e) => setFileText(e.target.value)}
            placeholder="也可以直接把作业内容粘贴到这里，每行一条"
          />
          <button
            type="button" className="hw-btn" data-variant="primary"
            disabled={!fileText.trim()}
            onClick={async () => {
              // 失败时保留粘贴的原文，用户可以直接重试
              const ok = await importText(fileText);
              if (!ok) return;
              setFileText('');
              setImportError('');
              closeDialog();
            }}
          >确认导入</button>
        </div>
      </ProDialog>

      {/* 导出 */}
      <ProDialog
        open={dialog === 'export'}
        onOpenChange={(v) => { if (!v) closeDialog(); }}
        title="导出作业"
        desc={`共 ${tasks.length} 项作业。打印 / 存为 PDF 会打开系统打印窗口。`}
        className="sm:max-w-[540px]"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(EXPORT_LABELS) as ExportFormat[]).map((format) => (
            <button key={format} type="button" className="hw-panel p-3 text-left hover:opacity-80" onClick={() => doExport(format)}>
              <span className="hw-title flex items-center gap-1 text-sm"><Download size={14} /> {EXPORT_LABELS[format].name}</span>
              <span className="hw-label block">{EXPORT_LABELS[format].hint}</span>
            </button>
          ))}
        </div>
      </ProDialog>

      {/* 回收站 */}
      <ProDialog
        open={dialog === 'recycle'}
        onOpenChange={(v) => { if (!v) closeDialog(); }}
        title="回收站"
        desc="删除后 8 秒内可撤销；超过时间会从云端移除，恢复时会新建一条副本。"
        className="sm:max-w-[540px]"
      >
        {recycle.length === 0 ? <p className="hw-label">回收站是空的</p> : (
          <div className="space-y-1">
            {recycle.map((t, i) => (
              <div key={`${t.id}-${i}`} className="hw-row flex items-center gap-2">
                <span className="flex-1 truncate text-sm">{t.text}</span>
                <button type="button" className="hw-chip" onClick={() => void restoreFromRecycle(t)}><RotateCcw size={11} /> 恢复</button>
              </div>
            ))}
            <button type="button" className="hw-btn mt-2" onClick={clearRecycle}><Trash2 size={13} /> 清空回收站</button>
          </div>
        )}
      </ProDialog>

      {/* 通用确认（payload 由调用方传入） */}
      <ProDialog
        open={dialog === 'confirm'}
        onOpenChange={(v) => { if (!v) closeDialog(); }}
        title={typeof dialogPayload === 'string' ? dialogPayload : '请确认'}
        className="sm:max-w-[400px]"
      >
        <p className="hw-label">此操作不可撤销，确认继续吗？</p>
      </ProDialog>
    </>
  );
}
