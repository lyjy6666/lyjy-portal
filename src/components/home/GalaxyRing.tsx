'use client';

import { useEffect, useState } from 'react';

type Star = { left: string; top: string; size: number; color: string; duration: string; delay: string; bright: boolean };
const colors = ['#ffffff', '#bfdbfe', '#c4b5fd', '#93c5fd', '#a5f3fc'];

export default function GalaxyRing() {
  const [stars, setStars] = useState<Star[] | null>(null);

  useEffect(() => {
    // 星点坐标只在客户端随机生成，避免服务端/客户端渲染不一致
    const gaussian = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    const build = (radius: number, spread: number) => {
      const angle = (Math.random() * Math.PI * 2);
      return { radius: radius * (1 + gaussian() * spread), angle };
    };
    const toStar = ({ radius, angle }: { radius: number; angle: number }, bright: boolean): Star => ({
      left: `${50 + radius * Math.cos(angle)}%`,
      top: `${50 + radius * Math.sin(angle)}%`,
      size: bright ? 1.8 + Math.random() * 0.8 : 0.5 + Math.random() * 1.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: `${2.4 + Math.random() * 4}s`,
      delay: `${Math.random() * 5}s`,
      bright,
    });

    const band = Array.from({ length: 190 }, (_, i) => {
      const angle = (i / 190) * Math.PI * 2 + gaussian() * 0.11;
      return toStar({ radius: 46 * (1 + gaussian() * 0.085), angle }, i % 9 === 0);
    });
    const dust = Array.from({ length: 110 }, () => toStar(build(20 + Math.random() * 74, 0.25), Math.random() < 0.06));

    setStars([...band, ...dust]);
  }, []);

  return (
    <div className="portal-galaxy" aria-hidden="true">
      <span className="portal-nebula portal-nebula--a" />
      <span className="portal-nebula portal-nebula--b" />
      <span className="portal-nebula portal-nebula--c" />
      <span className="portal-orbit portal-orbit--outer" />
      <span className="portal-orbit portal-orbit--inner" />

      <div className="portal-starfield">
        <span className="portal-orbit portal-orbit--track" />
        {stars?.map((star, i) => (
          <span
            key={i}
            className="absolute rounded-full animate-[twinkle_var(--duration)_ease-in-out_var(--delay)_infinite]"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              backgroundColor: star.color,
              color: star.color,
              '--duration': star.duration,
              '--delay': star.delay,
              boxShadow: star.bright ? '0 0 6px 1px currentColor' : undefined,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <span className="portal-meteor" />
      <span className="portal-meteor portal-meteor--late" />
    </div>
  );
}
