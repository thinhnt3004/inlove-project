"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function StarryNight() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [stars, setStars] = useState<Array<{ id: number; top: number; left: number; size: number; duration: number }>>([]);
  const [shootingStars, setShootingStars] = useState<Array<{ id: number; top: number; left: number; delay: number }>>([]);

  useEffect(() => {
    setMounted(true);
    // Generate static stars
    const newStars = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2, // Twinkle duration
    }));
    setStars(newStars);

    // Generate shooting stars
    const newShootingStars = Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      top: Math.random() * 50, // Top half of screen
      left: Math.random() * 80 + 10,
      delay: Math.random() * 10,
    }));
    setShootingStars(newShootingStars);
  }, []);

  if (!mounted || theme !== "dark") return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-slate-950">
      {/* Nền gradient tối cho đêm */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 opacity-80" />
      
      {/* Sao tĩnh nhấp nháy */}
      {stars.map(star => (
        <div
          key={`star-${star.id}`}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            top: `${star.top}vh`,
            left: `${star.left}vw`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.duration / 2}s`,
          }}
        />
      ))}

      {/* Sao băng */}
      {shootingStars.map(star => (
        <div
          key={`shooting-${star.id}`}
          className="absolute h-[2px] w-[50px] bg-gradient-to-r from-transparent via-white to-transparent rotate-[45deg] animate-shooting-star"
          style={{
            top: `${star.top}vh`,
            left: `${star.left}vw`,
            animationDelay: `${star.delay}s`,
            opacity: 0
          }}
        />
      ))}

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 8px 2px rgba(255, 255, 255, 0.4); }
        }
        @keyframes shooting-star {
          0% { transform: translateX(0) translateY(0) rotate(45deg) scale(0); opacity: 0; }
          10% { transform: translateX(-5vw) translateY(5vh) rotate(45deg) scale(1); opacity: 1; }
          20% { transform: translateX(-20vw) translateY(20vh) rotate(45deg) scale(0); opacity: 0; }
          100% { opacity: 0; }
        }
        .animate-twinkle {
          animation: twinkle infinite ease-in-out alternate;
        }
        .animate-shooting-star {
          animation: shooting-star 15s infinite linear;
        }
      `}} />
    </div>
  );
}
