import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface GuestbookProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuestbookEntry {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
}

const API_URL = '/.netlify/functions/guestbook';

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function Guestbook({ isOpen, onClose }: GuestbookProps) {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadEntries = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('加载失败');
        const data = await res.json();
        const entriesArray: GuestbookEntry[] = data.map((item: any) => ({
          id: item.id,
          nickname: item.nickname,
          content: item.content,
          timestamp: new Date(item.created_at).getTime(),
        }));
        setEntries(entriesArray);
      } catch (error) {
        console.error('加载留言失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();

    const interval = setInterval(loadEntries, 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      toast.error('请输入昵称');
      return;
    }
    if (!content.trim()) {
      toast.error('请输入留言内容');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          content: content.trim(),
        }),
      });

      if (!res.ok) throw new Error('发送失败');

      setNickname('');
      setContent('');
      toast.success('留言发送成功！');

      const refreshRes = await fetch(API_URL);
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const entriesArray: GuestbookEntry[] = data.map((item: any) => ({
          id: item.id,
          nickname: item.nickname,
          content: item.content,
          timestamp: new Date(item.created_at).getTime(),
        }));
        setEntries(entriesArray);
      }
    } catch (error) {
      console.error('发送留言失败:', error);
      toast.error('发送失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative w-full max-w-3xl max-h-[80vh] bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
          >
            <div className="sticky top-0 z-10 bg-white/10 backdrop-blur-md border-b border-white/10 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-comments text-white/80 text-xl"></i>
                <h2 className="text-2xl font-bold text-white">访客留言板</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full">Beta</span>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 group"
                aria-label="关闭"
              >
                <i className="fa-solid fa-times text-white/80 group-hover:text-white transition-colors"></i>
              </button>
            </div>

            <div className="flex flex-col h-[calc(80vh-80px)]">
              <div className="p-5 border-b border-white/10 bg-white/5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="nickname" className="block text-sm font-medium text-white/70 mb-2">
                      <i className="fa-solid fa-user mr-2"></i>昵称
                    </label>
                    <input
                      type="text"
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="请输入你的昵称"
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-300 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-white/70 mb-2">
                      <i className="fa-solid fa-comment mr-2"></i>留言内容
                    </label>
                    <textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="写下你想说的话..."
                      disabled={isSubmitting}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-300 resize-none disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        发送中...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane"></i>
                        发送留言
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <p className="text-white/60 text-sm">正在加载留言...</p>
                  </div>
                ) : entries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <i className="fa-solid fa-inbox text-4xl text-white/30"></i>
                    <p className="text-white/60 text-sm">还没有留言，来发第一条吧！</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/15 transition-all duration-300"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-user text-white"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white">{entry.nickname}</span>
                              <span className="text-white/40 text-sm">{formatRelativeTime(entry.timestamp)}</span>
                            </div>
                            <p className="text-white/80 whitespace-pre-wrap break-words">{entry.content}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
