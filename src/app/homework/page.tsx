'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';
import { Mic, MicOff, Check, Trash2, Plus, Sparkles, Clock, AlertTriangle, ChevronUp, Calendar, X, ChevronDown, RefreshCw, Download, Upload, User, LogOut } from 'lucide-react';
import * as mammoth from 'mammoth';
import { ConfettiExplosion } from '@/components/ConfettiExplosion';
import CalendarDialog from '@/components/CalendarDialog';

interface Task {
  id: number;
  text: string;
  completed: boolean;
  dueDate?: Date;
  isPinned?: boolean;
  recentlyRestored?: boolean;
}

interface UserInfo {
  id: number;
  username: string;
}

export default function HomeworkPage() {
  const [taskInput, setTaskInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBatchOperations, setShowBatchOperations] = useState(false);
  const [batchDueDate, setBatchDueDate] = useState('');
  const [showUpdateLog, setShowUpdateLog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('正在加载历史作业，请稍候');
  const [showHistory, setShowHistory] = useState(false);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showRightClickWarning, setShowRightClickWarning] = useState(false);
  const [exportButtonFlash, setExportButtonFlash] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [warningColor, setWarningColor] = useState<'yellow' | 'red'>('yellow');
  const [collapsedSubjects, setCollapsedSubjects] = useState<Set<string>>(new Set());

  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // 动画相关状态
  const [explosions, setExplosions] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const recognitionRef = useRef<any>(null);
  const isManualStopRef = useRef(false);  // 标记是否手动停止
  const clickCountTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 设置页面标题
  useEffect(() => {
    document.title = 'lyjy作业管理系统';
  }, []);

  // 初始加载动画
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let progress = 0;
    let paused = false;

    const startAnimation = () => {
      interval = setInterval(() => {
        // 如果已经达到99%且未暂停，先停顿一下
        if (progress >= 99 && !paused) {
          progress = 99;
          setLoadingProgress(99);
          paused = true;
          clearInterval(interval);

          // 0.5秒后跳到100%
          setTimeout(() => {
            setLoadingProgress(100);
          }, 500); // 99% 时停顿 0.5 秒

          // 1秒后进入主界面（99%停顿0.5秒 + 100%显示0.5秒）
          setTimeout(() => {
            setInitialLoading(false);
          }, 1000);
          return;
        }

        // 根据当前进度调整增量
        let increment: number;
        if (progress < 93) {
          // 0-93%: 每次增加 5-15%
          increment = Math.random() * 10 + 5;
        } else if (progress < 96) {
          // 93-96%: 增加到接近99%
          increment = Math.min(Math.random() * 2 + 1, 99 - progress);
        } else if (progress < 99) {
          // 96-99%: 精确控制，确保停在99%
          increment = Math.min(Math.random() * 1 + 0.5, 99 - progress);
        } else {
          // 已达99%
          return;
        }

        progress += increment;
        setLoadingProgress(Math.min(progress, 99)); // 暂时不显示100%
      }, 200); // 每 200ms 更新一次
    };

    startAnimation();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // 动态更新加载文字
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setLoadingText('正在加载AI系统，请稍后');
    }, 1000); // 1秒后更新

    const timer2 = setTimeout(() => {
      setLoadingText('即将进入系统，请稍后');
    }, 2000); // 2秒后更新

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // 监听右键和中键事件
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showWarningAndFlash();
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) { // 中键
        e.preventDefault();
        showWarningAndFlash();
      }
    };

    // 显示警告并闪光
    const showWarningAndFlash = () => {
      // 增加点击计数
      setClickCount(prev => {
        const newCount = prev + 1;

        // 清除之前的重置定时器
        if (clickCountTimeoutRef.current) {
          clearTimeout(clickCountTimeoutRef.current);
        }

        // 设置新的重置定时器：3秒无操作后重置计数
        clickCountTimeoutRef.current = setTimeout(() => {
          setClickCount(0);
          setWarningColor('yellow');
        }, 3000);

        // 根据点击次数决定是否显示提示和提示颜色
        if (newCount < 3) {
          // 1-2次：黄色提示
          setWarningColor('yellow');
          setShowRightClickWarning(true);
          setExportButtonFlash(true);

          // 3秒后隐藏警告
          setTimeout(() => {
            setShowRightClickWarning(false);
          }, 3000);

          // 2秒后停止闪光
          setTimeout(() => {
            setExportButtonFlash(false);
          }, 2000);
        } else if (newCount < 5) {
          // 3-4次：红色提示
          setWarningColor('red');
          setShowRightClickWarning(true);
          setExportButtonFlash(true);

          // 3秒后隐藏警告
          setTimeout(() => {
            setShowRightClickWarning(false);
          }, 3000);

          // 2秒后停止闪光
          setTimeout(() => {
            setExportButtonFlash(false);
          }, 2000);
        } else {
          // 5次及以上：不显示提示，只禁用
          // 不做任何操作，只是禁用右键/中键
        }

        return newCount;
      });
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('mousedown', handleMouseDown);
      if (clickCountTimeoutRef.current) {
        clearTimeout(clickCountTimeoutRef.current);
      }
    };
  }, []);

  const getAuthHeaders = (): HeadersInit => {
    if (!currentUser) return {};
    return { 'X-User-Id': String(currentUser.id) };
  };

  const handleLogin = async () => {
    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError('请输入用户名和密码');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const response = await fetch('/api/homework/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || '登录失败');
        return;
      }

      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('homeworkUser', JSON.stringify(data.user));
        setShowAuthDialog(false);
        setAuthUsername('');
        setAuthPassword('');
        setAuthError('');
      }
    } catch (error) {
      console.error('登录失败:', error);
      setAuthError('登录失败，请重试');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError('请输入用户名和密码');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const response = await fetch('/api/homework/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || '注册失败');
        return;
      }

      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('homeworkUser', JSON.stringify(data.user));
        setShowAuthDialog(false);
        setAuthUsername('');
        setAuthPassword('');
        setAuthError('');
      }
    } catch (error) {
      console.error('注册失败:', error);
      setAuthError('注册失败，请重试');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('homeworkUser');
    setTasks([]);
  };

  // 加载任务列表
  const loadTasks = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/homework/tasks', {
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        setCurrentUser(null);
        localStorage.removeItem('homeworkUser');
        setShowAuthDialog(true);
        return;
      }

      if (!response.ok) {
        console.error('加载任务失败:', response.status);
        return;
      }

      const data = await response.json();
      console.log('加载到的任务:', data);

      if (data.tasks) {
        setTasks(data.tasks.map((task: any) => {
          let dueDate: Date | undefined;
          if (task.dueDate) {
            try {
              dueDate = new Date(task.dueDate);
              if (isNaN(dueDate.getTime())) {
                console.warn('无效的日期格式:', task.dueDate);
                dueDate = undefined;
              }
            } catch (error) {
              console.error('日期转换失败:', error);
              dueDate = undefined;
            }
          }

          return {
            ...task,
            dueDate
          };
        }));
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 从 localStorage 恢复登录状态
  useEffect(() => {
    const savedUser = localStorage.getItem('homeworkUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user && user.id && user.username) {
          setCurrentUser(user);
        }
      } catch {
        localStorage.removeItem('homeworkUser');
      }
    }
  }, []);

  // 初始加载任务列表（只在加载动画完成且用户已登录时执行）
  useEffect(() => {
    if (!initialLoading && currentUser) {
      loadTasks();
    }
  }, [initialLoading, currentUser]);

  // 未登录时显示登录弹窗
  useEffect(() => {
    if (!initialLoading && !currentUser) {
      setShowAuthDialog(true);
    }
  }, [initialLoading, currentUser]);

  // 定时更新倒计时（每分钟更新一次）
  useEffect(() => {
    const timer = setInterval(() => {
      // 触发重新渲染以更新倒计时
      setTasks(prev => [...prev]);
    }, 60000); // 60秒

    return () => clearInterval(timer);
  }, []);

  // 组件卸载时停止录音
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // 提取科目名称
  const extractSubject = (taskText: string): string => {
    const subjects = [
      '语文', '数学', '英语', '英语单词', '英语阅读', '英语作文',
      '物理', '化学', '生物',
      '历史', '地理', '政治',
      '音乐', '美术', '体育',
      '科学', '信息技术', '编程', '计算机',
      '道德与法治', '思想品德'
    ];

    // 优先匹配完整科目名
    for (const subject of subjects.sort((a, b) => b.length - a.length)) {
      if (taskText.includes(subject)) {
        return subject;
      }
    }

    // 如果没有找到科目，返回"其他"
    return '其他';
  };

  // 按科目分组任务
  const groupTasksBySubject = (tasks: Task[]): Record<string, Task[]> => {
    const grouped: Record<string, Task[]> = {};

    tasks.forEach(task => {
      const subject = extractSubject(task.text);
      if (!grouped[subject]) {
        grouped[subject] = [];
      }
      grouped[subject].push(task);
    });

    return grouped;
  };

  // 切换科目折叠状态
  const toggleSubjectCollapse = (subject: string) => {
    setCollapsedSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subject)) {
        newSet.delete(subject);
      } else {
        newSet.add(subject);
      }
      return newSet;
    });
  };

  // 添加任务（打字输入）
  const handleAddTask = async () => {
    if (!taskInput.trim()) return;
    setIsProcessing(true);
    
    try {
      console.log('开始添加作业:', taskInput, dueDate);
      
      const response = await fetch('/api/homework/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ 
          text: taskInput,
          dueDate: dueDate 
        }),
      });
      
      console.log('API响应状态:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API错误:', errorData);
        alert(errorData.error || '添加作业失败，请重试');
        setIsProcessing(false);
        return;
      }
      
      const data = await response.json();
      console.log('API返回数据:', data);

      if (data.tasks) {
        const newTasks = data.tasks.map((task: any) => {
          // 安全转换 dueDate
          let dueDate: Date | undefined;
          if (task.dueDate) {
            try {
              dueDate = new Date(task.dueDate);
              if (isNaN(dueDate.getTime())) {
                dueDate = undefined;
              }
            } catch (error) {
              console.error('日期转换失败:', error);
              dueDate = undefined;
            }
          }
          return {
            ...task,
            dueDate
          };
        });
        console.log('新任务列表:', newTasks);
        setTasks(prev => [...prev, ...newTasks]);
      }
      setTaskInput('');
      setDueDate('');
    } catch (error) {
      console.error('Error processing tasks:', error);
      alert('添加作业失败，请重试');
    }
    
    setIsProcessing(false);
  };

  // 语音输入
  const handleVoiceInput = async () => {
    // 如果正在录音，则停止录音（手动停止）
    if (isRecording && recognitionRef.current) {
      isManualStopRef.current = true;  // 标记为手动停止
      recognitionRef.current.stop();
      return;
    }

    // 检查浏览器支持
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音识别功能。请使用 Chrome、Edge 或 Safari 最新版本。');
      return;
    }

    try {
      // 请求麦克风权限
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (error) {
      console.error('麦克风权限请求失败:', error);
      alert('无法访问麦克风。请在浏览器设置中允许麦克风权限，然后刷新页面重试。');
      return;
    }

    // 重置手动停止标记
    isManualStopRef.current = false;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = 'zh-CN';
    recognition.continuous = true;  // 持续录音，不自动停止
    recognition.interimResults = true;  // 显示中间识别结果
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('语音识别已启动');
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      console.log('收到语音识别结果');
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          console.log('最终结果:', transcript);
        }
      }

      // 只更新最终结果到输入框
      if (finalTranscript) {
        setTaskInput(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error, event.message);
      
      // 如果是 no-speech 错误且正在录音，不要停止录音
      if (event.error === 'no-speech' && isRecording && !isManualStopRef.current) {
        console.log('未检测到语音，继续录音');
        return;
      }

      setIsRecording(false);
      recognitionRef.current = null;
      
      let errorMsg = '语音识别出错，请重试';
      switch (event.error) {
        case 'audio-capture':
          errorMsg = '无法捕获音频，请检查麦克风是否正常工作';
          break;
        case 'not-allowed':
          errorMsg = '麦克风权限被拒绝。请在浏览器设置中允许麦克风权限';
          break;
        case 'network':
          errorMsg = '网络错误，请检查网络连接后重试';
          break;
        case 'aborted':
          errorMsg = '语音识别已取消';
          break;
        default:
          errorMsg = `语音识别出错: ${event.error || '未知错误'}`;
      }
      alert(errorMsg);
    };

    recognition.onend = () => {
      console.log('语音识别已结束');
      
      // 如果是手动停止，则更新状态；否则重新启动（持续录音模式）
      if (isManualStopRef.current) {
        console.log('手动停止录音');
        setIsRecording(false);
        recognitionRef.current = null;
        isManualStopRef.current = false;
      } else if (isRecording && recognitionRef.current) {
        console.log('自动重新启动语音识别（持续录音模式）');
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('重新启动语音识别失败:', error);
          setIsRecording(false);
          recognitionRef.current = null;
        }
      } else {
        setIsRecording(false);
        recognitionRef.current = null;
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('启动语音识别失败:', error);
      setIsRecording(false);
      recognitionRef.current = null;
      alert('启动语音识别失败，请重试');
    }
  };

  // 标记任务完成（带炫酷动画，乐观更新）
  const toggleTask = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newCompleted = !task.completed;

    // 获取按钮位置用于粒子爆炸效果（如果是标记为完成）
    let x = 0, y = 0;
    if (newCompleted) {
      const buttonElement = document.querySelector(`[data-task-id="${id}"] .complete-button`) as HTMLElement;
      x = buttonElement?.getBoundingClientRect().left + buttonElement.offsetWidth / 2 || window.innerWidth / 2;
      y = buttonElement?.getBoundingClientRect().top + buttonElement.offsetHeight / 2 || window.innerHeight / 2;
    }

    // 乐观更新：先更新状态
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completed: newCompleted, recentlyRestored: !newCompleted } : t
    ));

    // 如果任务被标记为完成，立即显示粒子爆炸效果
    if (newCompleted) {
      const explosionId = Date.now();
      setExplosions(prev => [...prev, { id: explosionId, x, y }]);
      setTimeout(() => {
        setExplosions(prev => prev.filter(e => e.id !== explosionId));
      }, 1000);
    }

    // 如果任务从完成变为未完成，3秒后清除 recentlyRestored 标志
    if (!newCompleted) {
      setTimeout(() => {
        setTasks(prev => prev.map(t =>
          t.id === id ? { ...t, recentlyRestored: false } : t
        ));
      }, 3000);
    }

    // 然后调用 API
    try {
      const response = await fetch(`/api/homework/tasks/${id}/toggle`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (!data.task || data.task.completed !== newCompleted) {
        // 如果失败或状态不一致，回滚更新
        setTasks(prev => prev.map(t =>
          t.id === id ? { ...t, completed: !newCompleted, recentlyRestored: false } : t
        ));
      }
    } catch (error) {
      // 如果失败，回滚更新
      console.error('Error toggling task:', error);
      setTasks(prev => prev.map(t =>
        t.id === id ? { ...t, completed: !newCompleted, recentlyRestored: false } : t
      ));
    }
  };

  // 单个任务置顶
  const toggleTaskPin = async (id: number) => {
    try {
      const response = await fetch(`/api/homework/tasks/${id}/pin`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.task) {
        setTasks(prev => prev.map(task =>
          task.id === id ? { ...task, isPinned: data.task.isPinned } : task
        ));
      }
    } catch (error) {
      console.error('Error toggling task pin:', error);
    }
  };

  // 删除任务
  const deleteTask = async (id: number) => {
    try {
      const response = await fetch(`/api/homework/tasks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== id));
        // 从选中列表中移除
        setSelectedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('删除作业失败，请重试');
    }
  };

  // 批量选择/取消选择
  const toggleSelectTask = (id: number) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 全选/取消全选未完成的任务
  const handleSelectAllActive = () => {
    const activeTasks = tasks.filter(t => !t.completed);
    const selectedActiveTasks = Array.from(selectedTasks).filter(id => activeTasks.some(t => t.id === id));

    if (selectedActiveTasks.length === activeTasks.length) {
      // 全部取消未完成的任务
      setSelectedTasks(prev => {
        const newSet = new Set(prev);
        activeTasks.forEach(t => newSet.delete(t.id));
        return newSet;
      });
    } else {
      // 全选所有未完成的任务
      setSelectedTasks(prev => {
        const newSet = new Set(prev);
        activeTasks.forEach(t => newSet.add(t.id));
        return newSet;
      });
    }
  };

  // 全选/取消全选已完成的任务（历史记录）
  const handleSelectAllCompleted = () => {
    const completedTasks = tasks.filter(t => t.completed);
    const selectedCompletedTasks = Array.from(selectedTasks).filter(id => completedTasks.some(t => t.id === id));

    if (selectedCompletedTasks.length === completedTasks.length) {
      // 全部取消已完成的任务
      setSelectedTasks(prev => {
        const newSet = new Set(prev);
        completedTasks.forEach(t => newSet.delete(t.id));
        return newSet;
      });
    } else {
      // 全选所有已完成的任务
      setSelectedTasks(prev => {
        const newSet = new Set(prev);
        completedTasks.forEach(t => newSet.add(t.id));
        return newSet;
      });
    }
  };

  // 切换批量选择模式
  const toggleBatchOperations = () => {
    setShowBatchOperations(prev => {
      if (prev) {
        // 取消批量选择时清空已勾选项
        setSelectedTasks(new Set());
      }
      return !prev;
    });
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedTasks.size === 0) {
      alert('请先选择要删除的作业');
      return;
    }
    if (confirm(`确定要删除选中的 ${selectedTasks.size} 个作业吗？`)) {
      try {
        await Promise.all(
          Array.from(selectedTasks).map(id =>
            fetch(`/api/homework/tasks/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
          )
        );
        setTasks(prev => prev.filter(task => !selectedTasks.has(task.id)));
        setSelectedTasks(new Set());
        setShowBatchOperations(false);
      } catch (error) {
        console.error('Error batch deleting tasks:', error);
        alert('批量删除失败，请重试');
      }
    }
  };

  // 批量修改到期时间
  const handleBatchUpdateDueDate = async () => {
    if (selectedTasks.size === 0) {
      alert('请先选择要修改的作业');
      return;
    }
    if (!batchDueDate) {
      alert('请选择到期时间');
      return;
    }
    
    try {
      const newDueDate = new Date(batchDueDate);
      await Promise.all(
        Array.from(selectedTasks).map(id =>
          fetch(`/api/homework/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ dueDate: newDueDate }),
          })
        )
      );
      setTasks(prev => prev.map(task =>
        selectedTasks.has(task.id)
          ? { ...task, dueDate: newDueDate }
          : task
      ));
      setSelectedTasks(new Set());
      setBatchDueDate('');
      setShowBatchOperations(false);
    } catch (error) {
      console.error('Error batch updating due dates:', error);
      alert('批量修改时间失败，请重试');
    }
  };

  // 批量置顶
  const handleBatchPin = async () => {
    if (selectedTasks.size === 0) {
      alert('请先选择要置顶的作业');
      return;
    }
    
    try {
      await Promise.all(
        Array.from(selectedTasks).map(id =>
          fetch(`/api/homework/tasks/${id}/pin`, { method: 'POST', headers: getAuthHeaders() })
        )
      );
      setTasks(prev => prev.map(task =>
        selectedTasks.has(task.id)
          ? { ...task, isPinned: !task.isPinned }
          : task
      ));
      setSelectedTasks(new Set());
      setShowBatchOperations(false);
    } catch (error) {
      console.error('Error batch pinning tasks:', error);
      alert('批量置顶失败，请重试');
    }
  };

  // 单个任务修改到期时间
  const updateTaskDueDate = async (id: number, newDueDate: string) => {
    try {
      const response = await fetch(`/api/homework/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          dueDate: newDueDate ? new Date(newDueDate) : null
        }),
      });
      const data = await response.json();
      if (data.task) {
        setTasks(prev => prev.map(task =>
          task.id === id
            ? { ...task, dueDate: data.task.dueDate }
            : task
        ));
      }
    } catch (error) {
      console.error('Error updating task due date:', error);
      alert('修改到期时间失败，请重试');
    }
  };

  // 生成导出内容（优化版）
  const generateExportContent = (format: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const dateStr = `${year}年${now.getMonth() + 1}月${now.getDate()}日`;
    const timeStr = `${hours}:${minutes}`;
    const fileNameDate = `${year}-${month}-${day}`;

    let mimeType = '';
    let extension = '';
    let contentParts: string[] = [];

    // 待完成作业
    const pendingTasks = tasks.filter(t => !t.completed);
    // 已完成作业
    const completedTasks = tasks.filter(t => t.completed);

    // 辅助函数：格式化日期
    const formatDate = (date: Date | string) => {
      const d = date instanceof Date ? date : new Date(date);
      const dy = d.getFullYear();
      const dm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dh = String(d.getHours()).padStart(2, '0');
      const dmin = String(d.getMinutes()).padStart(2, '0');
      return `${dy}-${dm}-${dd} ${dh}:${dmin}`;
    };

    if (format === 'txt') {
      mimeType = 'text/plain;charset=utf-8';
      extension = 'txt';
      contentParts = [
        '作业清单导出',
        `导出时间：${dateStr} ${timeStr}`,
        '========================================\n',
        '',
        `【待完成作业】（${pendingTasks.length}项）`,
        '----------------------------------------',
        ...pendingTasks.map((task, index) => {
          let line = `${index + 1}. ${task.text}`;
          if (task.dueDate) {
            line += `\n   到期时间：${formatDate(task.dueDate)}`;
          }
          return line;
        }),
        '',
        ...(completedTasks.length > 0 ? [
          `【已完成作业】（${completedTasks.length}项）`,
          '----------------------------------------',
          ...completedTasks.map((task, index) => `${index + 1}. ${task.text}`),
          ''
        ] : [])
      ];
    } else if (format === 'md') {
      mimeType = 'text/markdown;charset=utf-8';
      extension = 'md';
      contentParts = [
        '# 作业清单',
        '',
        `**导出时间：** ${dateStr} ${timeStr}`,
        '',
        '---',
        '',
        `## 待完成作业（${pendingTasks.length}项）`,
        '',
        ...pendingTasks.map((task, index) => {
          let line = `${index + 1}. ${task.text}`;
          if (task.dueDate) {
            line += `\n   *到期时间：${formatDate(task.dueDate)}*`;
          }
          return line;
        }),
        '',
        ...(completedTasks.length > 0 ? [
          `## 已完成作业（${completedTasks.length}项）`,
          '',
          ...completedTasks.map((task, index) => `${index + 1}. ${task.text}`),
          ''
        ] : [])
      ];
    } else if (format === 'doc') {
      mimeType = 'application/msword';
      extension = 'doc';
      contentParts = [
        `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>`,
        '<head>',
        '<meta charset="utf-8">',
        '<title>作业清单</title>',
        '<style>',
        'body { font-family: "Microsoft YaHei", Arial, sans-serif; margin: 40px; line-height: 1.6; }',
        'h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }',
        'h2 { color: #1e40af; margin-top: 30px; }',
        '.pending { color: #dc2626; }',
        '.completed { color: #059669; }',
        '.due-date { color: #666; font-size: 0.9em; margin-left: 20px; }',
        '.task-item { margin: 10px 0; }',
        '</style>',
        '</head>',
        '<body>',
        '<h1>作业清单</h1>',
        `<p><strong>导出时间：</strong>${dateStr} ${timeStr}</p>`,
        '<hr>',
        pendingTasks.length > 0
          ? `<h2 class="pending">待完成作业（${pendingTasks.length}项）</h2>`
          : `<h2 class="pending">待完成作业（0项）</h2><p>暂无待完成作业</p>`
      ];

      if (pendingTasks.length > 0) {
        contentParts.push(
          ...pendingTasks.map((task, index) => {
            let line = `<div class="task-item"><strong>${index + 1}.</strong> ${task.text}`;
            if (task.dueDate) {
              line += `<span class="due-date">（到期时间：${formatDate(task.dueDate)}）</span>`;
            }
            return line + '</div>';
          })
        );
      }

      if (completedTasks.length > 0) {
        contentParts.push(
          `<h2 class="completed">已完成作业（${completedTasks.length}项）</h2>`,
          ...completedTasks.map((task, index) => `<div class="task-item"><strong>${index + 1}.</strong> ${task.text}</div>`)
        );
      }

      contentParts.push('</body></html>');
    }

    return { content: contentParts.join('\n'), mimeType, extension, fileNameDate };
  };

  // 导出作业
  const exportTasks = (format: string) => {
    // 防止重复点击
    if (isExporting) return;

    try {
      setIsExporting(true);
      setExportingFormat(format);

      let content: string;
      let mimeType: string;
      let extension: string;
      let fileNameDate: string;

      if (format === 'pdf') {
        // PDF 使用打印功能，生成 DOC 格式的 HTML 内容
        const docContent = generateExportContent('doc');
        content = docContent.content;
        mimeType = 'text/html';
        extension = 'html';
        fileNameDate = docContent.fileNameDate;
      } else {
        const result = generateExportContent(format);
        content = result.content;
        mimeType = result.mimeType;
        extension = result.extension;
        fileNameDate = result.fileNameDate;
      }

      if (format === 'pdf') {
        // PDF 使用打印功能
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(content);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 500);
        }
      } else {
        // 其他格式使用 Blob 下载
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `作业清单_${fileNameDate}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      setShowExportDialog(false);

      // 根据格式设置不同的恢复时间
      const recoveryTime = format === 'txt' ? 10000 : 5000;

      // 恢复导出按钮
      setTimeout(() => {
        setIsExporting(false);
        setExportingFormat('');
      }, recoveryTime);
    } catch (error) {
      console.error('导出作业失败:', error);
      alert('导出作业失败，请重试');
      setIsExporting(false);
      setExportingFormat('');
    }
  };

  // 打开导出对话框
  const openExportDialog = () => {
    if (tasks.length === 0) {
      alert('暂无作业可导出');
      return;
    }
    setShowExportDialog(true);
  };

  // 触发文件选择器（导入文档为作业）
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // 导入文档为作业（支持 txt/doc/docx/md，字数超过5000不处理）
  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    // 校验文件类型
    const isTxt = fileName.endsWith('.txt');
    const isMd = fileName.endsWith('.md');
    const isDocx = fileName.endsWith('.docx');
    const isDoc = fileName.endsWith('.doc');

    if (!isTxt && !isMd && !isDocx && !isDoc) {
      alert('仅支持 txt、doc、docx、md 格式文件');
      event.target.value = '';
      return;
    }

    // .doc 旧版二进制格式无法在浏览器端解析，提示用户转换
    if (isDoc) {
      alert('Word文档（.doc）请先另存为 txt 格式后再导入');
      event.target.value = '';
      return;
    }

    // 导入前确认提示
    if (!confirm('确认导入该文档？\n将按行分割，每行作为一个作业任务。')) {
      event.target.value = '';
      return;
    }

    setIsImporting(true);

    try {
      let content = '';

      if (isDocx) {
        // 使用 mammoth 解析 docx 文档提取纯文本
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else {
        // txt 和 md 文件直接读取文本
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('文件读取失败'));
          reader.readAsText(file, 'UTF-8');
        });
      }

      if (!content || !content.trim()) {
        alert('文件内容为空');
        setIsImporting(false);
        event.target.value = '';
        return;
      }

      // 字数限制检查（先检查再处理）
      if (content.length > 5000) {
        alert('文件字数超过5000，请选择更小的文件');
        setIsImporting(false);
        event.target.value = '';
        return;
      }

      // 将文本按行分割，每行作为一个作业任务
      const lines = content
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        alert('未找到有效的作业内容');
        setIsImporting(false);
        event.target.value = '';
        return;
      }

      const response = await fetch('/api/homework/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ lines, dueDate: '' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '导入失败');
      }

      const data = await response.json();

      // 收集成功添加的任务
      const newTasks: Task[] = (data.tasks || []).map((task: any) => {
        let dueDate: Date | undefined;
        if (task.dueDate) {
          try {
            dueDate = new Date(task.dueDate);
            if (isNaN(dueDate.getTime())) dueDate = undefined;
          } catch {
            dueDate = undefined;
          }
        }
        return { ...task, dueDate };
      });

      if (newTasks.length > 0) {
        setTasks(prev => [...prev, ...newTasks]);
      }

      const failCount = data.failCount || 0;
      if (failCount === 0) {
        alert(`导入成功！共导入 ${newTasks.length} 条作业`);
      } else {
        alert(`导入完成：成功 ${newTasks.length} 条，失败 ${failCount} 条`);
      }
    } catch (error) {
      console.error('导入文档失败:', error);
      alert('导入文档失败，请重试');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  // 格式化本地时间为datetime-local格式 (YYYY-MM-DDTHH:mm)
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // 计算到期时间
  const getTimeUntilDue = (dueDate?: Date | string) => {
    if (!dueDate) return null;

    // 确保 dueDate 是 Date 对象
    let date: Date;
    if (dueDate instanceof Date) {
      date = dueDate;
    } else if (typeof dueDate === 'string') {
      date = new Date(dueDate);
    } else {
      return null;
    }

    // 检查日期是否有效
    if (isNaN(date.getTime())) return null;

    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff <= 0) return { text: '已过期', urgent: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let text = '';
    let urgent = false;

    if (days > 0) {
      text = `${days}天后到期`;
      if (days === 1) urgent = true;
    } else if (hours > 0) {
      text = `${hours}小时后到期`;
      if (hours <= 2) urgent = true;
    } else if (minutes > 0) {
      text = `${minutes}分钟后到期`;
      if (minutes <= 30) urgent = true;
    } else {
      text = '即将到期';
      urgent = true;
    }

    return { text, urgent };
  };

  // 排序任务（置顶 > 未完成按到期时间 > 已完成）
  const sortedTasks = [...tasks].sort((a, b) => {
    // 置顶的任务排在最前面
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }

    // 已完成的任务排在最后
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // 如果都已完成或都未完成，按到期时间排序
    if (a.completed) return 0; // 已完成的按添加顺序

    // 未完成的按到期时间排序
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1; // 没有到期时间的排在后面
    if (!b.dueDate) return -1;

    // 确保 dueDate 是 Date 对象
    const dateA = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate);
    const dateB = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate);

    // 检查日期是否有效
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;

    return dateA.getTime() - dateB.getTime();
  });

  return (
    <>
      {/* 加载动画 */}
      {initialLoading && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center">
          {/* 背景网格和光效 */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[150px]" />
          </div>

          {/* 加载内容 */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Logo 图标容器 */}
            <div className="relative">
              {/* 外圈旋转动画 */}
              <div className="absolute inset-0 w-32 h-32 -m-4 border-2 border-blue-500/30 rounded-full animate-spin" />
              
              {/* 内圈旋转动画（反向） */}
              <div className="absolute inset-0 w-28 h-28 -m-2 border-2 border-purple-500/30 rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
              
              {/* Logo 图标 */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/50 animate-pulse relative z-10">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* 加载文字 */}
            <h2 className="text-2xl font-semibold text-white">
              {loadingText}
            </h2>

            {/* 进度条容器 */}
            <div className="w-80 h-3 bg-slate-800 rounded-full overflow-hidden shadow-lg">
              {/* 进度条 */}
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-full transition-all duration-200 ease-out relative"
                style={{ width: `${loadingProgress}%` }}
              >
                {/* 进度条发光效果 */}
                <div className="absolute inset-0 bg-white/20 blur-sm" />
                {/* 进度条前端高光 */}
                <div 
                  className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-lg shadow-blue-500/50"
                  style={{ opacity: loadingProgress > 0 && loadingProgress < 100 ? 1 : 0 }}
                />
              </div>
            </div>

            {/* 进度百分比 */}
            <div className="flex items-center gap-3">
              <p className="text-slate-400 text-lg font-mono">
                {Math.round(loadingProgress)}%
              </p>
              {/* 加载中的小圆点动画 */}
              {loadingProgress < 100 && (
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 主界面 */}
      {!initialLoading && (
        <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
          {/* 背景网格和光效 */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[150px]" />
          </div>

          {/* 主容器 */}
          <div className="relative z-10 container mx-auto px-4 py-6 min-h-screen">
        {/* 右键/中键警告提示 */}
        {showRightClickWarning && (
          <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 backdrop-blur-sm text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-300 ${
            warningColor === 'yellow'
              ? 'bg-amber-500/90 shadow-amber-500/50'
              : 'bg-red-500/90 shadow-red-500/50'
          }`}>
            <p className="text-sm font-medium">
              为优化本站体验，本站禁用中键和右键，如需导出作业可点击导出作业为文档按钮
            </p>
          </div>
        )}

        {/* 标题 */}
        <header className="text-center mb-6 relative">
          {/* 右上角登录/用户信息 */}
          <div className="absolute top-0 right-0 z-20">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-slate-200 font-medium">{currentUser.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">退出</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthDialog(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25 hover:scale-105"
              >
                <User className="w-4 h-4" />
                <span>登录 / 注册</span>
              </button>
            )}
          </div>

          <p className="text-slate-400 text-base mb-3">提笔即专注，落笔有收获</p>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            lyjy作业管理系统
          </h1>
          <div className="flex items-center justify-center gap-3">
            <p className="text-slate-400 text-lg">语音或文字输入，智能分点，轻松管理</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">AI 智能作业管理系统</span>
            </div>
          </div>
        </header>

        {/* 主内容区域 - 左右两栏布局 */}
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* 左侧：输入区域 */}
          <div className="lg:w-1/3 flex-shrink-0">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl sticky top-6">
              <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" />
                添加作业
              </h2>
              <div className="flex flex-col gap-4">
            <div className="relative">
              <textarea
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="在此输入您的作业内容..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all resize-none h-40"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  onClick={handleVoiceInput}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse hover:bg-red-500/30'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span className="text-sm">停止录音</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span className="text-sm">语音输入</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* 到期时间选择器 */}
            <div className="flex items-center gap-3 pt-2">
              <Clock className="w-5 h-5 text-slate-400" />
              <label className="text-sm text-slate-400">到期时间（可选）:</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all"
              />
            </div>
            
            <button
              onClick={handleAddTask}
              disabled={!taskInput.trim() || isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 enabled:hover:scale-105"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>智能处理中...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>添加作业</span>
                </>
              )}
            </button>
              </div>
            </div>

            {/* 导入 / 导出作业板块 */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl mt-4">
              <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                导入 / 导出作业
              </h2>
              {/* 导入文档为作业（支持 txt/doc/docx/md） */}
              <button
                onClick={handleImportClick}
                disabled={isImporting}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 enabled:hover:scale-105 mb-4"
              >
                {isImporting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>导入中，请稍候...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>导入文档为作业（支持 txt/doc/md）</span>
                  </>
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".txt,.doc,.docx,.md"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
              {/* 导出作业为文档 */}
              <button
                onClick={openExportDialog}
                disabled={tasks.length === 0 || isExporting}
                className={`w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/25 enabled:hover:scale-105 ${
                  exportButtonFlash ? 'animate-pulse ring-4 ring-yellow-400 ring-opacity-50 shadow-xl shadow-yellow-400/50' : ''
                } ${isExporting ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isExporting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>
                      {exportingFormat === 'txt'
                        ? 'TXT导出中，请稍候...'
                        : '请稍候...'
                      }
                    </span>
                  </>
                ) : (
                  <>
                    <Download className={`w-5 h-5 ${exportButtonFlash ? 'animate-bounce' : ''}`} />
                    <span>导出作业为文档</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 右侧：作业列表 */}
          <div className="lg:w-2/3 flex-1">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                  <Check className="w-5 h-5 text-blue-400" />
                  作业清单
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    ({tasks.filter(t => !t.completed).length} 待完成)
                  </span>
            </h2>
            {!isLoading && currentUser && tasks.length > 0 && (
              <button
                onClick={loadTasks}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                刷新
              </button>
            )}
          </div>
          
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <div className="w-10 h-10 mx-auto mb-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p>加载中...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-slate-600" />
              </div>
              <p>还没有作业，开始添加吧！</p>
            </div>
          ) : (
            <>
              {/* 批量操作按钮栏 */}
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <button
                  onClick={toggleBatchOperations}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-all text-sm"
                >
                  <Check className="w-4 h-4" />
                  {showBatchOperations ? '取消批量选择' : `批量选择 (${selectedTasks.size})`}
                </button>

                {showBatchOperations && selectedTasks.size > 0 && (
                  <>
                    <div className="h-6 w-px bg-slate-600 mx-1" />
                    <button
                      onClick={handleBatchDelete}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 transition-all text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除 ({selectedTasks.size})
                    </button>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <input
                        type="datetime-local"
                        value={batchDueDate}
                        onChange={(e) => setBatchDueDate(e.target.value)}
                        className="bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all"
                      />
                      <button
                        onClick={handleBatchUpdateDueDate}
                        className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-all text-sm"
                      >
                        设置时间
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* 任务列表 - 按科目分组显示未完成的 */}
              <div className="space-y-4">
                {showBatchOperations && (
                  <button
                    onClick={handleSelectAllActive}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/50 transition-all text-sm"
                  >
                    <Check className="w-4 h-4" />
                    全选待完成任务
                  </button>
                )}

                {/* 按科目分组 */}
                {(() => {
                  const activeTasks = sortedTasks.filter(t => !t.completed);
                  const groupedTasks = groupTasksBySubject(activeTasks);

                  return Object.entries(groupedTasks).map(([subject, subjectTasks]) => {
                    const isCollapsed = collapsedSubjects.has(subject);
                    const shouldCollapse = subjectTasks.length >= 2 && isCollapsed;

                    return (
                      <div key={subject} className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
                        {/* 科目标题 */}
                        <button
                          onClick={() => toggleSubjectCollapse(subject)}
                          className={`w-full flex items-center justify-between p-4 border-b border-slate-700/50 transition-all ${
                            subjectTasks.length >= 2
                              ? 'hover:bg-slate-800/50 cursor-pointer'
                              : 'cursor-default'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30">
                              {subject.charAt(0)}
                            </div>
                            <div className="text-left">
                              <div className="text-lg font-semibold text-slate-200">
                                {subject}
                              </div>
                              <div className="text-xs text-slate-500">
                                {subjectTasks.length} 项作业
                              </div>
                            </div>
                          </div>

                          {subjectTasks.length >= 2 && (
                            <ChevronDown
                              className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                                shouldCollapse ? 'rotate-180' : ''
                              }`}
                            />
                          )}
                        </button>

                        {/* 任务列表 */}
                        {(!shouldCollapse || subjectTasks.length < 2) && (
                          <div className="px-4 pb-4 space-y-3">
                            {subjectTasks.map((task) => {
                              const timeInfo = getTimeUntilDue(task.dueDate);

                              return (
                                <div
                                  key={task.id}
                                  data-task-id={task.id}
                                  className={`group flex items-start gap-3 p-4 rounded-xl transition-all duration-200 ${
                                    task.recentlyRestored
                                      ? 'bg-amber-950/30 border-2 border-amber-500 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/30 animate-pulse'
                                      : timeInfo?.urgent
                                      ? 'bg-red-950/30 border border-red-500/50 hover:border-red-500/80 hover:shadow-lg hover:shadow-red-500/30'
                                      : 'bg-slate-800/50 border border-slate-700 hover:border-blue-500/80 hover:shadow-lg hover:shadow-blue-500/30'
                                  } ${task.isPinned ? 'ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20' : ''}`}
                                >
                                  {/* 批量选择框 */}
                                  {showBatchOperations && (
                                    <button
                                      onClick={() => toggleSelectTask(task.id)}
                                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                                        selectedTasks.has(task.id)
                                          ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/50'
                                          : 'border-slate-600 hover:border-blue-500'
                                      }`}
                                    >
                                      {selectedTasks.has(task.id) && <Check className="w-3 h-3 text-white" />}
                                    </button>
                                  )}

                                  {/* 完成状态切换 */}
                                  <button
                                    onClick={() => toggleTask(task.id)}
                                    className={`complete-button flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-300 mt-0.5 ${
                                      'border-slate-600 hover:border-green-400 hover:bg-green-500/10'
                                    }`}
                                  >
                                    <Check className="w-4 h-4 text-transparent" />
                                  </button>

                                  <div className="flex-1 min-w-0">
                                    <span className={`block text-base transition-all duration-300 ${
                                      task.recentlyRestored ? 'text-amber-200' : 'text-slate-200'
                                    }`}>
                                      {task.text}
                                      {task.recentlyRestored && (
                                        <span className="ml-2 text-xs text-amber-400">✨ 已恢复</span>
                                      )}
                                    </span>

                                    {/* 到期时间显示和修改 */}
                                    {timeInfo && (
                                      <div className={`flex items-center gap-1.5 mt-2 text-xs ${
                                        timeInfo.urgent ? 'text-red-400 font-semibold animate-pulse' : 'text-slate-400'
                                      }`}>
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{timeInfo.text}</span>
                                        {timeInfo.urgent && <AlertTriangle className="w-3.5 h-3.5" />}
                                      </div>
                                    )}

                                    {/* 单个任务到期时间选择器 */}
                                    <div className="mt-2 flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-slate-500" />
                                      <input
                                        type="datetime-local"
                                        value={
                                          task.dueDate
                                            ? (task.dueDate instanceof Date
                                                ? formatDateTimeLocal(task.dueDate)
                                                : formatDateTimeLocal(new Date(task.dueDate)))
                                            : ''
                                        }
                                        onChange={(e) => updateTaskDueDate(task.id, e.target.value)}
                                        className="bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all"
                                      />
                                    </div>
                                  </div>

                                  {/* 置顶按钮（移到右边，悬停显示） */}
                                  <button
                                    onClick={() => toggleTaskPin(task.id)}
                                    className={`flex-shrink-0 w-8 h-8 rounded-lg transition-all flex items-center ${
                                      task.isPinned
                                        ? 'bg-purple-500 text-white opacity-100 shadow-lg shadow-purple-500/50'
                                        : 'bg-slate-700/50 text-slate-400 hover:text-purple-400 hover:bg-purple-500/20 opacity-0 group-hover:opacity-100'
                                    }`}
                                    title={task.isPinned ? '取消置顶' : '置顶'}
                                  >
                                    <ChevronUp className="w-6 h-6 pl-3" />
                                  </button>

                                  <button
                                    onClick={() => deleteTask(task.id)}
                                    className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700/50 text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100 flex items-center"
                                  >
                                    <Trash2 className="w-6 h-6 pl-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* 历史记录区域 */}
              {tasks.filter(t => t.completed).length > 0 && (
                <div className="mt-6 border-t border-slate-700 pt-4">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors w-full"
                  >
                    {showHistory ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    历史记录 ({tasks.filter(t => t.completed).length})
                  </button>

                  {showHistory && (
                    <div className="mt-4 space-y-3">
                      {/* 历史记录全选按钮 */}
                      {showBatchOperations && (
                        <button
                          onClick={handleSelectAllCompleted}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50 transition-all text-sm"
                        >
                          <Check className="w-4 h-4" />
                          全选历史记录
                        </button>
                      )}

                      {/* 历史记录提示 */}
                      <div className="text-center text-xs text-slate-500 mb-2">
                        点击绿色复选框可恢复任务至待完成列表
                      </div>

                      {sortedTasks.filter(t => t.completed).map((task) => {
                        const timeInfo = getTimeUntilDue(task.dueDate);

                        return (
                          <div
                            key={task.id}
                            data-task-id={task.id}
                            className={`group flex items-start gap-3 p-4 rounded-xl transition-all duration-200 bg-green-950/30 border border-green-500/50 opacity-60 hover:opacity-80`}
                          >
                            {/* 批量选择框 */}
                            {showBatchOperations && (
                              <button
                                onClick={() => toggleSelectTask(task.id)}
                                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                                  selectedTasks.has(task.id)
                                    ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/50'
                                    : 'border-slate-600 hover:border-blue-500'
                                }`}
                              >
                                {selectedTasks.has(task.id) && <Check className="w-3 h-3 text-white" />}
                              </button>
                            )}

                            {/* 完成状态切换（恢复） */}
                            <button
                              onClick={() => toggleTask(task.id)}
                              className={`complete-button flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-300 mt-0.5 bg-gradient-to-br from-green-400 to-green-600 border-green-500 shadow-lg shadow-green-500/50 scale-110`}
                            >
                              <Check className="w-4 h-4 text-white" />
                            </button>

                            <div className="flex-1 min-w-0">
                              <span className="block text-base transition-all duration-300 text-slate-500 line-through">
                                {task.text}
                              </span>

                              {/* 到期时间显示 */}
                              {timeInfo && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{timeInfo.text}</span>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => deleteTask(task.id)}
                              className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700/50 text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
            </div>
          </div>
        </div>
      </div>

      {/* 右下角按钮组 */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {/* 返回首页按钮 */}
        <Link
          href="/"
          className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-green-700 shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center"
          title="返回首页"
        >
          <i className="fa-solid fa-house text-white"></i>
        </Link>

        {/* 时钟按钮 */}
        <button
          onClick={() => setShowUpdateLog(true)}
          className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/50 hover:scale-110 transition-all flex items-center justify-center group animate-pulse"
        >
          <Clock className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </button>

        {/* 日程表按钮 */}
        <button
          onClick={() => setShowCalendarDialog(true)}
          className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg shadow-purple-500/25 hover:shadow-purple-500/50 hover:scale-110 transition-all flex items-center justify-center group"
        >
          <Calendar className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* 导出格式选择弹窗 */}
      {showExportDialog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowExportDialog(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-400" />
                选择导出格式
              </h3>
              <button
                onClick={() => setShowExportDialog(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => !isExporting && exportTasks('txt')}
                disabled={isExporting}
                className={`flex flex-col items-center gap-2 p-4 bg-slate-800/50 border border-slate-700 rounded-xl transition-all group ${
                  isExporting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-blue-500 hover:bg-slate-800'
                }`}
              >
                <Download className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-white text-sm font-medium">TXT 文本</span>
              </button>

              <button
                onClick={() => !isExporting && exportTasks('md')}
                disabled={isExporting}
                className={`flex flex-col items-center gap-2 p-4 bg-slate-800/50 border border-slate-700 rounded-xl transition-all group ${
                  isExporting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-purple-500 hover:bg-slate-800'
                }`}
              >
                <Download className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-white text-sm font-medium">Markdown</span>
              </button>

              <button
                onClick={() => !isExporting && exportTasks('doc')}
                disabled={isExporting}
                className={`flex flex-col items-center gap-2 p-4 bg-slate-800/50 border border-slate-700 rounded-xl transition-all group ${
                  isExporting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-blue-500 hover:bg-slate-800'
                }`}
              >
                <Download className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-white text-sm font-medium">Word 文档</span>
              </button>

              <button
                onClick={() => !isExporting && exportTasks('pdf')}
                disabled={isExporting}
                className={`flex flex-col items-center gap-2 p-4 bg-slate-800/50 border border-slate-700 rounded-xl transition-all group ${
                  isExporting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-red-500 hover:bg-slate-800'
                }`}
              >
                <Download className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform" />
                <span className="text-white text-sm font-medium">PDF 文档</span>
              </button>
            </div>

            {isExporting && (
              <div className="mb-4 text-center">
                <p className="text-amber-400 text-sm font-medium animate-pulse">
                  {exportingFormat === 'txt'
                    ? 'TXT格式导出时间较久，请耐心等待'
                    : '正在导出，请稍候...'
                  }
                </p>
              </div>
            )}

            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-400 text-sm text-center">
                如需转换格式，请前往{' '}
                <a
                  href="https://lyjytool.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  lyjy格式转换工具箱
                </a>
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowExportDialog(false)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all font-medium"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 更新记录弹窗 */}
      {showUpdateLog && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowUpdateLog(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                更新记录
              </h3>
              <button
                onClick={() => setShowUpdateLog(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 最新版本 V4.0 */}
            <div className="relative bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl p-4 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20 mb-3">
              <div className="absolute -left-3 top-1/2 transform -translate-y-1/2">
                <span className="inline-flex items-center justify-center px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full shadow-lg">
                  NEW
                </span>
              </div>
              <div className="pl-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-300 font-bold text-sm">2026.7.11</span>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-medium rounded">V4.0</span>
                </div>
                <ul className="text-slate-200 text-sm space-y-1.5 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>新增导入文档为作业功能</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>新增云端储存作业，登录即可多设备同步</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>修复了一些已知问题</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 历史版本 V3.1 */}
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-slate-400 font-semibold text-sm">2026.2.6</span>
                <span className="px-2 py-0.5 bg-slate-700/50 text-slate-400 text-xs font-medium rounded">V3.1</span>
              </div>
              <ul className="text-slate-400 text-sm space-y-1">
                <li>• 界面、性能与体验进一步优化</li>
                <li>• 新增导出功能</li>
                <li>• 优化安全与交互</li>
                <li>• 修复了一些已知问题</li>
              </ul>
            </div>

            {/* 历史版本 V3.0 */}
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-slate-400 font-semibold text-sm">2026.2.5</span>
                <span className="px-2 py-0.5 bg-slate-700/50 text-slate-400 text-xs font-medium rounded">V3.0</span>
              </div>
              <ul className="text-slate-400 text-sm space-y-1">
                <li>• 优化界面布局：左右两栏设计，左侧输入右侧列表</li>
                <li>• 新增月历视图，支持按日期查看作业</li>
                <li>• 新增独立的全选/取消全选功能</li>
                <li>• 修复时间选择器时区显示问题</li>
              </ul>
            </div>

            {/* 历史版本 V2.0 */}
            <div className="bg-slate-800/20 rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-slate-500 font-semibold text-sm">2026.1.30</span>
                <span className="px-2 py-0.5 bg-slate-700/30 text-slate-500 text-xs font-medium rounded">V2.0</span>
              </div>
              <p className="text-slate-500 text-sm">
                网站焕新上线了
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowUpdateLog(false)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all font-medium"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 粒子爆炸效果 */}
      {explosions.map(explosion => (
        <ConfettiExplosion
          key={explosion.id}
          x={explosion.x}
          y={explosion.y}
          onComplete={() => {
            setExplosions(prev => prev.filter(e => e.id !== explosion.id));
          }}
        />
      ))}

      {/* 登录/注册弹窗 */}
      {showAuthDialog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            if (currentUser) setShowAuthDialog(false);
          }}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 背景光效 */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-[80px]" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                  {authTab === 'login' ? '欢迎回来' : '创建账户'}
                </h3>
                {currentUser && (
                  <button
                    onClick={() => setShowAuthDialog(false)}
                    className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!currentUser && (
                <p className="text-slate-400 text-sm mb-6">
                  登录后即可保存您的作业数据，多设备同步
                </p>
              )}

              {/* Tab 切换 */}
              <div className="flex bg-slate-800/50 rounded-xl p-1 mb-6">
                <button
                  onClick={() => {
                    setAuthTab('login');
                    setAuthError('');
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    authTab === 'login'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  登录
                </button>
                <button
                  onClick={() => {
                    setAuthTab('register');
                    setAuthError('');
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    authTab === 'register'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  注册
                </button>
              </div>

              {/* 错误提示 */}
              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {authError}
                </div>
              )}

              {/* 表单 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2 font-medium">用户名</label>
                  <input
                    type="text"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (authTab === 'login' ? handleLogin() : handleRegister())}
                    placeholder="请输入用户名"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2 font-medium">密码</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (authTab === 'login' ? handleLogin() : handleRegister())}
                    placeholder="请输入密码"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                onClick={authTab === 'login' ? handleLogin : handleRegister}
                disabled={authLoading || !authUsername.trim() || !authPassword.trim()}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 enabled:hover:scale-[1.02]"
              >
                {authLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{authTab === 'login' ? '登录中...' : '注册中...'}</span>
                  </>
                ) : (
                  <span>{authTab === 'login' ? '登录' : '注册'}</span>
                )}
              </button>

              {!currentUser && (
                <p className="text-center text-slate-500 text-xs mt-4">
                  您的数据将安全存储，仅您本人可访问
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 日程表弹窗 */}
      <CalendarDialog
        isOpen={showCalendarDialog}
        onClose={() => setShowCalendarDialog(false)}
        tasks={tasks}
      />
      </div>
    )}
    </>
  );
}
