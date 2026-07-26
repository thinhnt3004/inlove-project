"use client";

import { useState, useEffect, useRef } from "react";
import { useCouple } from "@/context/CoupleContext";
import { API_BASE_URL } from '@/config';

export default function Home() {
  const { coupleData, updateCoupleData, logout } = useCouple();
  
  const [loveStartDate, setLoveStartDate] = useState(new Date()); 
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [avatar1, setAvatar1] = useState<string | null>(null);
  const [avatar2, setAvatar2] = useState<string | null>(null);

  const [user1Name, setUser1Name] = useState("Nam");
  const [user2Name, setUser2Name] = useState("Nữ");
  const [user1Dob, setUser1Dob] = useState("");
  const [user2Dob, setUser2Dob] = useState("");
  const [mood1, setMood1] = useState<string | null>(null);
  const [mood2, setMood2] = useState<string | null>(null);
  const [moodModal, setMoodModal] = useState<{isOpen: boolean, userIndex: number | null}>({isOpen: false, userIndex: null});
  const [flyingHearts, setFlyingHearts] = useState<{id: number, x: number, y: number}[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const getZodiacSign = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
  
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Bạch Dương ♈";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Kim Ngưu ♉";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return "Song Tử ♊";
    if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return "Cự Giải ♋";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Sư Tử ♌";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Xử Nữ ♍";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return "Thiên Bình ♎";
    if ((month === 10 && day >= 24) || (month === 11 && day <= 21)) return "Bọ Cạp ♏";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Nhân Mã ♐";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Ma Kết ♑";
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Bảo Bình ♒";
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Song Ngư ♓";
    return "";
  };

  useEffect(() => {
    if (coupleData) {
      setLoveStartDate(new Date(coupleData.LoveStartDate));
      if (coupleData.users && coupleData.users.length >= 2) {
         setAvatar1(coupleData.users[0].AvatarUrl);
         setAvatar2(coupleData.users[1].AvatarUrl);
         setUser1Name(coupleData.users[0].Nickname || "Nam");
         setUser2Name(coupleData.users[1].Nickname || "Nữ");
         setUser1Dob(coupleData.users[0].DateOfBirth ? coupleData.users[0].DateOfBirth.substring(0, 10) : "");
         setUser2Dob(coupleData.users[1].DateOfBirth ? coupleData.users[1].DateOfBirth.substring(0, 10) : "");
         setMood1(coupleData.users[0].Mood || null);
         setMood2(coupleData.users[1].Mood || null);
      }
    }
  }, [coupleData]);

  // Effect chạy đồng hồ
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = now.getTime() - loveStartDate.getTime();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeTogether({ days, hours, minutes, seconds });
      } else {
        setTimeTogether({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [loveStartDate]);

  const handleUpdateDate = async () => {
    if (!coupleData) return;
    setIsEditingDate(false);
    const offset = loveStartDate.getTimezoneOffset() * 60000;
    const newDate = (new Date(loveStartDate.getTime() - offset)).toISOString().slice(0, -1);
    try {
      const res = await fetch(`${API_BASE_URL}/api/couple/${coupleData.CoupleID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ love_start_date: newDate })
      });
      if (res.ok) {
        updateCoupleData({ LoveStartDate: newDate });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const MOOD_EMOJIS = ["🥰", "😴", "😡", "😭", "🤒", "🥳", "🥺", "🤯", "🥶", "😻"];

  const handleUpdateMood = async (userIndex: number, mood: string) => {
    if (!coupleData?.users || coupleData.users.length <= userIndex) return;
    const userId = coupleData.users[userIndex].UserID;
    try {
      await fetch(`${API_BASE_URL}/api/user/${userId}/mood`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: mood })
      });
      // local update
      if (userIndex === 0) setMood1(mood);
      else setMood2(mood);
      setMoodModal({isOpen: false, userIndex: null});
      
      const newUsers = [...coupleData.users];
      newUsers[userIndex] = { ...newUsers[userIndex], Mood: mood };
      updateCoupleData({ ...coupleData, users: newUsers });
    } catch (err) {
      console.error(err);
    }
  };

  const handleHug = (e: React.MouseEvent, targetName: string) => {
    e.stopPropagation();
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    const newHearts = Array.from({length: 12}).map((_, i) => ({
      id: Date.now() + i,
      x: 20 + Math.random() * (windowWidth - 60),
      y: (windowHeight / 2) + Math.random() * 200 // Start from middle-bottom
    }));
    
    setFlyingHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => {
      const ids = newHearts.map(h => h.id);
      setFlyingHearts(prev => prev.filter(h => !ids.includes(h.id)));
    }, 2500);
    
    setToastMessage(`Đã gửi một cái ôm đến ${targetName}! ❤️`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAvatarUpload = async (userIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !coupleData || coupleData.users.length < 2) return;
    
    const userId = coupleData.users[userIndex].UserID;
    
    // Tạo preview ngay lập tức
    const tempUrl = URL.createObjectURL(file);
    if (userIndex === 0) setAvatar1(tempUrl);
    else setAvatar2(tempUrl);

    // Upload lên server
    const formData = new FormData();
    formData.append("file", file);
    try {
      const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      
      if (uploadRes.ok) {
        // Cập nhật avatar cho user
        await fetch(`${API_BASE_URL}/api/user/${userId}/avatar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar_url: uploadData.url })
        });
        
        // Cập nhật context
        const newUsers = [...coupleData.users];
        newUsers[userIndex] = { ...newUsers[userIndex], AvatarUrl: API_BASE_URL + uploadData.url };
        updateCoupleData({ ...coupleData, users: newUsers });
      }
    } catch (err) {
      alert("Lỗi tải ảnh lên!");
    }
  };

  const handleUpdateProfile = async (userIndex: number, nickname: string, dob: string) => {
    if (!coupleData || coupleData.users.length < 2) return;
    const userId = coupleData.users[userIndex].UserID;
    try {
      await fetch(`${API_BASE_URL}/api/user/${userId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nickname: nickname, 
          date_of_birth: dob ? dob : null 
        })
      });
      
      // Cập nhật context
      const newUsers = [...coupleData.users];
      newUsers[userIndex] = { 
        ...newUsers[userIndex], 
        Nickname: nickname,
        DateOfBirth: dob ? dob : null 
      };
      updateCoupleData({ ...coupleData, users: newUsers });
    } catch (err) {
      console.error(err);
    }
  };

  if (!coupleData) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 to-red-50 dark:from-transparent dark:to-transparent flex flex-col items-center justify-center p-4 relative overflow-hidden pb-24">
      {/* Nền bong bóng */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 dark:opacity-0 animate-blob transition-opacity duration-500"></div>
      <div className="absolute top-20 right-20 w-48 h-48 bg-red-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 dark:opacity-0 animate-blob animation-delay-2000 transition-opacity duration-500"></div>
      <div className="absolute -bottom-8 left-20 w-40 h-40 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 dark:opacity-0 animate-blob animation-delay-4000 transition-opacity duration-500"></div>
      
      <div className="relative z-10 w-full max-w-2xl bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl rounded-[3rem] shadow-2xl dark:shadow-[0_0_40px_rgba(255,105,180,0.15)] border border-white dark:border-pink-500/20 p-8 md:p-12 text-center transition-all duration-500">
        
        {/* Avatars */}
        <div className="flex justify-center items-center gap-6 md:gap-16 w-full max-w-lg relative z-10">
          {/* Nam */}
          <div className="flex flex-col items-center group relative cursor-pointer">
            <div onClick={() => fileInput1Ref.current?.click()} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-pink-400/50 shadow-lg dark:shadow-[0_0_20px_rgba(255,105,180,0.4)] overflow-hidden bg-indigo-50 dark:bg-slate-800 flex items-center justify-center transition-all group-hover:scale-105 relative">
              {avatar1 ? (
                 <img src={avatar1} alt="Avatar 1" className="w-full h-full object-cover" />
              ) : (
                 <span className="text-4xl">🧑🏻</span>
              )}
            </div>
            
            {/* Mood Bubble 1 */}
            <div 
              onClick={(e) => { e.stopPropagation(); setMoodModal({isOpen: true, userIndex: 0}); }}
              className="absolute top-16 right-[-10px] md:top-24 md:right-0 bg-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-md border border-gray-100 cursor-pointer hover:scale-110 transition-transform z-10 text-lg md:text-2xl"
              title="Cập nhật cảm xúc"
            >
              {mood1 || "💭"}
            </div>

            <input type="file" ref={fileInput1Ref} className="hidden" accept="image/*" onChange={(e) => handleAvatarUpload(0, e)} />
            
            <div className="mt-4 flex flex-col items-center">
              <input 
                type="text" 
                value={user1Name}
                onChange={(e) => setUser1Name(e.target.value)}
                onBlur={() => handleUpdateProfile(0, user1Name, user1Dob)}
                className="font-bold text-gray-800 dark:text-pink-50 dark:drop-shadow-[0_0_5px_rgba(255,192,203,0.5)] text-lg bg-transparent border-b border-transparent hover:border-pink-200 dark:hover:border-pink-500 focus:border-pink-500 focus:outline-none text-center w-24 transition-colors" 
              />
              <div className="flex flex-col items-center mt-1">
                <div className="relative cursor-pointer flex justify-center items-center p-1 rounded hover:bg-white/40 transition-colors mt-0.5 mb-0.5">
                  <span className="text-xs text-gray-600 dark:text-white font-medium">
                    {user1Dob ? user1Dob.split('-').reverse().join('/') : "Ngày sinh"}
                  </span>
                  <input 
                    type="date" 
                    value={user1Dob}
                    onChange={(e) => {
                      setUser1Dob(e.target.value);
                      handleUpdateProfile(0, user1Name, e.target.value);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-[10px] bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full mt-1 font-medium shadow-sm">
                  {getZodiacSign(user1Dob) || "Cung hoàng đạo"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="animate-pulse text-4xl md:text-5xl drop-shadow-md">❤️</div>
          
          {/* Nữ */}
          <div className="flex flex-col items-center group relative cursor-pointer">
            <div onClick={() => fileInput2Ref.current?.click()} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-pink-400/50 shadow-lg dark:shadow-[0_0_20px_rgba(255,105,180,0.4)] overflow-hidden bg-pink-50 dark:bg-slate-800 flex items-center justify-center transition-all group-hover:scale-105 relative">
              {avatar2 ? (
                 <img src={avatar2} alt="Avatar 2" className="w-full h-full object-cover" />
              ) : (
                 <span className="text-4xl">👩🏻</span>
              )}
            </div>
            
            {/* Mood Bubble 2 */}
            <div 
              onClick={(e) => { e.stopPropagation(); setMoodModal({isOpen: true, userIndex: 1}); }}
              className="absolute top-16 right-[-10px] md:top-24 md:right-0 bg-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-md border border-gray-100 cursor-pointer hover:scale-110 transition-transform z-10 text-lg md:text-2xl"
              title="Cảm xúc"
            >
              {mood2 || "💭"}
            </div>

            <input type="file" ref={fileInput2Ref} className="hidden" accept="image/*" onChange={(e) => handleAvatarUpload(1, e)} />
            
            <div className="mt-4 flex flex-col items-center">
              <input 
                type="text" 
                value={user2Name}
                onChange={(e) => setUser2Name(e.target.value)}
                onBlur={() => handleUpdateProfile(1, user2Name, user2Dob)}
                className="font-bold text-gray-800 dark:text-white text-lg bg-transparent border-b border-transparent hover:border-pink-200 focus:border-pink-500 focus:outline-none text-center w-24 transition-colors" 
              />
              <div className="flex flex-col items-center mt-1">
                <div className="relative cursor-pointer flex justify-center items-center p-1 rounded hover:bg-white/40 transition-colors mt-0.5 mb-0.5">
                  <span className="text-xs text-gray-600 dark:text-white font-medium">
                    {user2Dob ? user2Dob.split('-').reverse().join('/') : "Ngày sinh"}
                  </span>
                  <input 
                    type="date" 
                    value={user2Dob}
                    onChange={(e) => {
                      setUser2Dob(e.target.value);
                      handleUpdateProfile(1, user2Name, e.target.value);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-[10px] bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full mt-1 font-medium shadow-sm">
                  {getZodiacSign(user2Dob) || "Cung hoàng đạo"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ngày bắt đầu */}
        <div className="flex flex-col items-center justify-center mt-8 relative z-10">
          {isEditingDate ? (
            <div className="flex items-center gap-2 bg-white/60 p-2 rounded-xl shadow-inner">
              <input 
                type="date" 
                value={loveStartDate.toISOString().split('T')[0]}
                onChange={(e) => setLoveStartDate(new Date(e.target.value))}
                className="p-2 rounded-lg bg-white border border-pink-200 focus:outline-none text-gray-700 dark:text-white"
              />
              <button onClick={handleUpdateDate} className="bg-pink-500 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-pink-600">Lưu</button>
            </div>
          ) : (
            <div className="flex items-center gap-3 group">
              <p className="text-gray-700 dark:text-gray-200 font-medium bg-white/40 dark:bg-slate-800/60 px-5 py-2 rounded-full shadow-sm dark:shadow-[0_0_15px_rgba(255,105,180,0.2)] dark:border dark:border-pink-500/30">
                Bắt đầu từ: <span className="font-bold text-pink-600 dark:text-pink-400 dark:drop-shadow-[0_0_8px_rgba(255,105,180,0.6)]">{loveStartDate.toLocaleDateString('vi-VN')}</span>
              </p>
              <button onClick={() => setIsEditingDate(true)} className="w-8 h-8 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center hover:bg-pink-200">
                ✏️
              </button>
            </div>
          )}
        </div>

        {/* Bộ đếm */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 relative z-10">
          <div className="bg-white/50 dark:bg-pink-950/40 rounded-2xl p-4 shadow-sm dark:shadow-[0_0_15px_rgba(255,105,180,0.15)] border border-white/50 dark:border-pink-500/20">
            <div className="text-4xl font-black text-pink-600 dark:text-pink-400 dark:drop-shadow-[0_0_8px_rgba(255,105,180,0.6)]">{timeTogether.days}</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Ngày</div>
          </div>
          <div className="bg-white/50 dark:bg-pink-950/40 rounded-2xl p-4 shadow-sm dark:shadow-[0_0_15px_rgba(255,105,180,0.15)] border border-white/50 dark:border-pink-500/20">
            <div className="text-4xl font-black text-pink-500 dark:text-pink-300 dark:drop-shadow-[0_0_8px_rgba(255,105,180,0.6)]">{timeTogether.hours}</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Giờ</div>
          </div>
          <div className="bg-white/50 dark:bg-pink-950/40 rounded-2xl p-4 shadow-sm dark:shadow-[0_0_15px_rgba(255,105,180,0.15)] border border-white/50 dark:border-pink-500/20">
            <div className="text-4xl font-black text-pink-400 dark:text-pink-200 dark:drop-shadow-[0_0_8px_rgba(255,105,180,0.6)]">{timeTogether.minutes}</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Phút</div>
          </div>
          <div className="bg-white/50 dark:bg-pink-950/40 rounded-2xl p-4 shadow-sm dark:shadow-[0_0_15px_rgba(255,105,180,0.15)] border border-white/50 dark:border-pink-500/20">
            <div className="text-4xl font-black text-pink-300 dark:text-pink-100 dark:drop-shadow-[0_0_8px_rgba(255,105,180,0.6)]">{timeTogether.seconds}</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Giây</div>
          </div>
        </div>
      </div>

      {/* Mood Selector & Hug Modal */}
      {moodModal.isOpen && moodModal.userIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setMoodModal({isOpen: false, userIndex: null})}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm transform scale-100 animate-pop-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-center mb-4 text-gray-800 dark:text-white">
              Trạng thái của {moodModal.userIndex === 0 ? user1Name : user2Name}
            </h3>
            
            <button 
              onClick={(e) => { handleHug(e, moodModal.userIndex === 0 ? user1Name : user2Name); setMoodModal({isOpen: false, userIndex: null}); }}
              className="w-full mb-6 bg-pink-100 hover:bg-pink-200 text-pink-600 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-2xl">🫂</span> Gửi một cái ôm!
            </button>
            
            <p className="text-sm text-gray-500 dark:text-white mb-3 text-center">Cập nhật tâm trạng</p>
            <div className="grid grid-cols-5 gap-3">
              {MOOD_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleUpdateMood(moodModal.userIndex as number, emoji)}
                  className="text-3xl hover:scale-125 transition-transform bg-gray-50 hover:bg-indigo-50 p-2 rounded-xl"
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setMoodModal({isOpen: false, userIndex: null})}
              className="w-full mt-6 bg-gray-100 text-gray-600 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Flying Hearts Animation */}
      {flyingHearts.map(heart => (
        <div 
          key={heart.id} 
          className="fixed text-5xl animate-float-up pointer-events-none z-[70]"
          style={{ left: heart.x, top: heart.y }}
        >
          ❤️
        </div>
      ))}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-pink-200 z-[80] animate-fade-in flex items-center gap-2">
          <span className="text-pink-600 font-bold text-sm md:text-base whitespace-nowrap">{toastMessage}</span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          20% { opacity: 1; transform: translateY(-50px) scale(1.2); }
          100% { transform: translateY(-400px) scale(1.5) rotate(15deg); opacity: 0; }
        }
        .animate-float-up {
          animation: floatUp 2.5s ease-out forwards;
        }
      `}} />
    </main>
  );
}
