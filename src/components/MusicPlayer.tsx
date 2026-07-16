import React, { useState, useRef, useEffect } from 'react';

// 定义歌曲类型
interface Song {
  id: number;
  title: string;
  artist: string;
  url: string;
}

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  // 拖拽相关状态
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const playerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 歌曲列表（目前只有一首，用户可以后续添加更多）
  const songs: Song[] = [
    {
      id: 1,
      title: "第57次取消发送",
      artist: "菲菲公主",
      url: "/music/song1.mp3"
    },
    // 用户可以在这里添加更多歌曲
    // {
    //   id: 2,
    //   title: "歌曲名称",
    //   artist: "歌手名",
    //   url: "/music/song2.mp3"
    // }
  ];

  const currentSong = songs[currentSongIndex];

  // 更新播放进度
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    return () => audio.removeEventListener('timeupdate', updateProgress);
  }, []);

  // 播放结束时自动下一首
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      playNext();
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentSongIndex]);

  // 切换播放状态
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  // 上一首
  const playPrevious = () => {
    const newIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
    setCurrentSongIndex(newIndex);
    setIsPlaying(true);
  };

  // 下一首
  const playNext = () => {
    let newIndex;
    if (isShuffled) {
      // 随机播放
      newIndex = Math.floor(Math.random() * songs.length);
    } else {
      // 顺序播放
      newIndex = currentSongIndex === songs.length - 1 ? 0 : currentSongIndex + 1;
    }
    setCurrentSongIndex(newIndex);
    setIsPlaying(true);
  };

  // 音量控制
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // 进度控制
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = (parseFloat(e.target.value) / 100) * (audioRef.current?.duration || 0);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  // 拖拽处理
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 监听鼠标移动和松开事件
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // 切换随机播放
  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* 音乐按钮（显示在主页） */}
      <button
        onClick={() => setShowPlayer(!showPlayer)}
        className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/20 transition-all duration-300 shadow-md"
        title={showPlayer ? '关闭播放器' : '打开音乐播放器'}
      >
        <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-music'} text-white text-lg`}></i>
      </button>

      {/* 完整播放器面板 */}
      {showPlayer && (
        <div
          ref={playerRef}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl w-80 p-4"
          style={{
            transform: `translate(${position.x}px, calc(-50% + ${position.y}px))`,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          {/* 拖拽手柄 - 歌曲信息区域 */}
          <div
            className="mb-4 cursor-move select-none"
            onMouseDown={handleMouseDown}
            title="拖动移动窗口"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg truncate">{currentSong.title}</h3>
                <p className="text-white/70 text-sm">{currentSong.artist}</p>
              </div>
              <button
                onClick={() => setShowPlayer(false)}
                className="text-white/60 hover:text-white transition-colors ml-2"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
          </div>

          {/* 隐藏的音频元素 */}
          <audio
            ref={audioRef}
            src={currentSong.url}
            onLoadedMetadata={() => {
              if (audioRef.current && isPlaying) {
                audioRef.current.play();
              }
            }}
            onCanPlay={() => {
              if (audioRef.current) {
                audioRef.current.volume = volume;
              }
            }}
          />

          {/* 进度条 */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <div className="flex justify-between text-white/60 text-xs mt-1">
              <span>{audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}</span>
              <span>{audioRef.current ? formatTime(audioRef.current.duration) : '0:00'}</span>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* 随机播放 */}
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition-colors ${
                isShuffled ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
              title={isShuffled ? '关闭随机播放' : '开启随机播放'}
            >
              <i className="fa-solid fa-shuffle"></i>
            </button>

            {/* 上一首 */}
            <button
              onClick={playPrevious}
              className="p-3 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
              title="上一首"
            >
              <i className="fa-solid fa-backward-step"></i>
            </button>

            {/* 播放/暂停 */}
            <button
              onClick={togglePlay}
              className="p-4 bg-white/30 rounded-full text-white hover:bg-white/40 transition-colors"
              title={isPlaying ? '暂停' : '播放'}
            >
              <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            </button>

            {/* 下一首 */}
            <button
              onClick={playNext}
              className="p-3 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
              title="下一首"
            >
              <i className="fa-solid fa-forward-step"></i>
            </button>
          </div>

          {/* 音量控制 */}
          <div className="flex items-center gap-2 mb-4">
            <i className="fa-solid fa-volume-high text-white/60"></i>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <span className="text-white/60 text-xs w-8">{Math.round(volume * 100)}%</span>
          </div>

          {/* 播放列表指示 */}
          <div className="mt-4 text-center">
            <p className="text-white/40 text-xs">
              第 {currentSongIndex + 1} 首 / 共 {songs.length} 首
            </p>
          </div>
        </div>
      )}
    </>
  );
}
