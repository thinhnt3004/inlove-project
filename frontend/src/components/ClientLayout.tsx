"use client";

import { useState } from "react";
import { useCouple } from "@/context/CoupleContext";
import MusicPlayer from "./MusicPlayer";
import BottomNav from "./BottomNav";
import ChatBubble from "./ChatBubble";
import ThemeToggle from "./ThemeToggle";
import FloatingHearts from "./FloatingHearts";
import StarryNight from "./StarryNight";
import { API_BASE_URL } from '@/config';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, login, logout } = useCouple();
  const [passcode, setPasscode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [mounted, setMounted] = useState(true); // SSR hydration safety

  const handleLoginSubmit = async () => {
    if (passcode.length !== 4) {
      setErrorMsg("Mã PIN phải có đúng 4 ký tự!");
      return;
    }
    const res = await login(passcode);
    if (!res.success) {
      setErrorMsg(res.message || "Lỗi đăng nhập!");
    }
  };

  const handleCreate = async () => {
    if (passcode.length !== 4) {
      setErrorMsg("Mã PIN phải có đúng 4 ký tự!");
      return;
    }
    try {
      const offset = new Date(newStartDate).getTimezoneOffset() * 60000;
      const localDateString = (new Date(new Date(newStartDate).getTime() - offset)).toISOString().slice(0, -1);
      const res = await fetch(`${API_BASE_URL}/api/couple/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ love_start_date: localDateString, passcode: passcode })
      });
      if (res.ok) {
        await login(passcode);
      } else {
        const data = await res.json();
        setErrorMsg(data.detail || "Không thể tạo không gian mới.");
      }
    } catch (err) {
      setErrorMsg("Lỗi kết nối máy chủ.");
    }
  };

  // Màn hình đăng nhập
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-red-50 dark:from-transparent dark:to-transparent p-4">
        <div className="bg-white dark:bg-pink-950/80 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-pink-50 dark:border-pink-500/20 relative overflow-hidden transition-colors">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 to-red-400"></div>
          
          <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <span className="text-4xl">💌</span>
          </div>
          
          <h1 className="text-3xl font-black text-gray-800 mb-2 font-serif">InLove</h1>
          <p className="text-gray-500 text-sm mb-8 font-medium">Không gian yêu thương của hai người</p>
          
          {isCreating ? (
            <div className="space-y-4">
              <div>
                <label className="block text-left text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ngày bắt đầu yêu</label>
                <input 
                  type="date" 
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full text-center text-lg p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all font-medium text-gray-700"
                />
              </div>
              <div>
                <label className="block text-left text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tạo mã PIN (4 số)</label>
                <input 
                  type="password" 
                  maxLength={4}
                  placeholder="••••"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full text-center text-2xl tracking-[1em] p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all text-gray-700 font-mono placeholder:tracking-normal"
                />
              </div>
              {errorMsg && <p className="text-red-500 text-sm font-medium animate-pulse">{errorMsg}</p>}
              <button 
                onClick={handleCreate}
                className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-all transform hover:-translate-y-1 shadow-lg shadow-pink-200 mt-2"
              >
                Tạo Không Gian Mới
              </button>
              <button 
                onClick={() => { setIsCreating(false); setErrorMsg(""); setPasscode(""); }}
                className="text-pink-500 text-sm mt-4 hover:underline font-medium"
              >
                Đã có mã PIN? Đăng nhập
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input 
                type="password" 
                maxLength={4}
                placeholder="Nhập mã PIN"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleLoginSubmit()}
                className="w-full text-center text-2xl tracking-[1em] p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all text-gray-700 font-mono placeholder:text-sm placeholder:tracking-normal"
              />
              {errorMsg && <p className="text-red-500 text-sm font-medium animate-pulse">{errorMsg}</p>}
              <button 
                onClick={handleLoginSubmit}
                className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-all transform hover:-translate-y-1 shadow-lg shadow-pink-200 mt-2"
              >
                Mở Khóa Không Gian
              </button>
              <button 
                onClick={() => { setIsCreating(true); setErrorMsg(""); setPasscode(""); }}
                className="text-pink-500 text-sm mt-4 hover:underline font-medium"
              >
                Tạo không gian mới
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Màn hình chính đã đăng nhập
  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex items-center justify-end gap-2 pointer-events-none">
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
        <div className="pointer-events-auto">
          <MusicPlayer />
        </div>
        <button 
          onClick={logout}
          className="pointer-events-auto h-8 flex items-center text-[10px] md:text-sm text-gray-500 hover:text-red-500 bg-white/70 dark:bg-slate-800/70 dark:text-gray-300 dark:hover:text-red-400 dark:border-slate-600 backdrop-blur-md px-3 rounded-full shadow border border-pink-50 transition-colors"
          title="Đăng xuất"
        >
          Đăng xuất
        </button>
      </div>
      <FloatingHearts />
      <StarryNight />
      {children}
      <ChatBubble />
      <BottomNav />
    </>
  );
}
