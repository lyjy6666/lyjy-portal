'use client';

import { useEffect, useState, useRef } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

interface ConfettiExplosionProps {
  x: number;
  y: number;
  onComplete?: () => void;
}

export function ConfettiExplosion({ x, y, onComplete }: ConfettiExplosionProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // 生成粒子
    const colors = [
      '#3B82F6', // blue-500
      '#8B5CF6', // purple-500
      '#EC4899', // pink-500
      '#10B981', // green-500
      '#F59E0B', // amber-500
      '#06B6D4', // cyan-500
      '#EF4444', // red-500
    ];

    const newParticles: Particle[] = [];

    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: i,
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }

    setParticles(newParticles);

    // 动画循环
    let frame = 0;
    const animate = () => {
      frame++;

      setParticles(prev => {
        const updated = prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy + 0.3, // 重力
          vx: p.vx * 0.98, // 阻力
          vy: p.vy * 0.98,
          rotation: p.rotation + p.rotationSpeed,
          opacity: Math.max(0, p.opacity - 0.02),
        }));

        // 如果所有粒子都消失了，停止动画
        if (frame > 60) {
          cancelAnimationFrame(animationRef.current!);
          onComplete?.();
          return [];
        }

        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [x, y, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1000]">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: `rotate(${p.rotation}deg)`,
            borderRadius: '2px',
            boxShadow: `0 0 ${p.size/2}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}
