'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

interface ComboCounterProps {
  combo: number;
  onReset: () => void;
}

export function ComboCounter({ combo, onReset }: ComboCounterProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (combo > 0) {
      // 缩放动画
      setScale(1.5);
      setTimeout(() => setScale(1), 150);
    }
  }, [combo]);

  if (combo === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
      <div
        className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500/90 to-red-500/90 border-2 border-yellow-400 shadow-2xl"
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        <Zap className="w-6 h-6 text-yellow-300 animate-pulse" />
        <span className="text-2xl font-bold text-white">
          连击 x{combo}
        </span>
        <Zap className="w-6 h-6 text-yellow-300 animate-pulse" />
      </div>
    </div>
  );
}
