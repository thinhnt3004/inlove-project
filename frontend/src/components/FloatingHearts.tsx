"use client";

import { useEffect, useState } from "react";

export default function FloatingHearts() {
  const [hearts, setHearts] = useState<Array<{ id: number; left: number; animationDuration: number; delay: number; size: number }>>([]);

  useEffect(() => {
    // Tạo trái tim ngẫu nhiên
    const interval = setInterval(() => {
      setHearts(prev => {
        // Giữ tối đa 15 trái tim cùng lúc
        if (prev.length > 15) return prev.slice(1);
        return [...prev, {
          id: Date.now(),
          left: Math.random() * 100, // 0-100vw
          animationDuration: 4 + Math.random() * 6, // 4-10s
          delay: Math.random() * 2,
          size: 10 + Math.random() * 20 // 10-30px
        }];
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="absolute bottom-[-50px] opacity-0 text-pink-400 dark:text-pink-600/50"
          style={{
            left: `${heart.left}vw`,
            fontSize: `${heart.size}px`,
            animation: `floatUp ${heart.animationDuration}s linear ${heart.delay}s forwards`
          }}
        >
          ❤
        </div>
      ))}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          50% { transform: translateY(-50vh) scale(1.2) rotate(20deg); opacity: 0.4; }
          100% { transform: translateY(-120vh) scale(0.8) rotate(-20deg); opacity: 0; }
        }
      `}} />
    </div>
  );
}
