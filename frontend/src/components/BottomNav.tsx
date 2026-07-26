"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCouple } from "@/context/CoupleContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useCouple();

  if (!isLoggedIn) return null;

    const navItems = [
      { label: "Trang chủ", href: "/", icon: "🏠" },
      { label: "Kỷ niệm", href: "/timeline", icon: "📖" },
      { label: "Sự kiện", href: "/countdown", icon: "⏰" },
      { label: "Hộp t.gian", href: "/capsule", icon: "⏳" },
      { label: "Hẹn hò", href: "/roulette", icon: "🎡" },
      { label: "Nhật ký", href: "/diary", icon: "💌" }
    ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 px-2 pb-2 pt-1 pointer-events-none flex justify-center">
      <div className="bg-white/80 dark:bg-pink-950/80 backdrop-blur-xl border border-pink-100 dark:border-pink-500/20 shadow-lg rounded-full px-4 py-2 flex items-center justify-between w-full max-w-md pointer-events-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 w-14 transition-all duration-300 ${
                isActive ? "text-pink-600 scale-105" : "text-gray-400 hover:text-pink-400"
              }`}
            >
              <div className={`text-xl drop-shadow-sm ${isActive ? 'animate-bounce' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-bold ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
