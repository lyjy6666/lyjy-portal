import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const Background: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 创建粒子
    const particles: {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
    }[] = [];
    
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2 + 0.5;
      const speedX = (Math.random() - 0.5) * 0.3;
      const speedY = (Math.random() - 0.5) * 0.3;
      
      // 蓝色系随机颜色
      const hue = 210 + Math.random() * 30;
      const saturation = 70 + Math.random() * 30;
      const lightness = 50 + Math.random() * 20;
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      
      particles.push({ x, y, size, speedX, speedY, color });
    }
    
    // 连接粒子的线
    const connectParticles = () => {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 - distance/750})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };
    
    // 动画循环
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 绘制网格背景
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 1;
      
      const gridSize = 50;
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // 更新和绘制所有粒子
      for (const particle of particles) {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // 边界检测
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
        
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 连接粒子
      connectParticles();
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);
  
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-blue-950 overflow-hidden">
      {/* 科技感网格和粒子背景 */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0"
      />
      
      {/* 发光效果覆盖层 */}
      <div className="absolute inset-0 bg-blue-900/10 backdrop-blur-[1px]"></div>
      
      {/* 光晕效果 */}
      <motion.div 
        className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[100px]"
        animate={{
          opacity: [0.2, 0.3, 0.2],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div 
        className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/20 blur-[100px]"
        animate={{
          opacity: [0.1, 0.2, 0.1],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
    </div>
  );
};

export default Background;
