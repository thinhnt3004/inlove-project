"use client";

import { useState, useEffect } from "react";
import { useCouple } from "@/context/CoupleContext";
import { API_BASE_URL } from "@/config";
import { useRouter } from "next/navigation";

interface Diary {
  DiaryID: string;
  CoupleID: string;
  AuthorID: string;
  Content: string;
  Mood: string | null;
  CreatedAt: string;
}

const MOOD_EMOJIS = ["😀", "🥰", "🥺", "😭", "😡", "💔", "🥱", "🤧", "🥳", "🤒"];

export default function DiaryPage() {
  const { coupleData, isLoggedIn } = useCouple();
  const router = useRouter();
  
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Composer state
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/");
      return;
    }
    
    if (coupleData) {
      fetchDiaries();
    }
  }, [coupleData, isLoggedIn, router]);

  const fetchDiaries = async () => {
    if (!coupleData) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/couple/${coupleData.CoupleID}/diaries`);
      if (res.ok) {
        const data = await res.json();
        setDiaries(data);
      }
    } catch (err) {
      console.error("Failed to fetch diaries", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePost = async (userIndex: number) => {
    if (!coupleData || !coupleData.users || coupleData.users.length < 2) return;
    if (!content.trim()) {
      showToast("Vui lòng nhập nội dung!");
      return;
    }
    
    setIsSubmitting(true);
    const authorId = coupleData.users[userIndex].UserID;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/couple/${coupleData.CoupleID}/diaries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          AuthorID: authorId,
          Content: content,
          Mood: selectedMood
        })
      });
      
      if (res.ok) {
        const newDiary = await res.json();
        setDiaries([newDiary, ...diaries]);
        setContent("");
        setSelectedMood(null);
        showToast("Đã lưu nhật ký! 💌");
      } else {
        showToast("Có lỗi xảy ra khi lưu!");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (diaryId: string) => {
    setConfirmDeleteId(diaryId);
  };

  const executeDelete = async (diaryId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/diary/${diaryId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setDiaries(diaries.filter(d => d.DiaryID !== diaryId));
        showToast("Đã xóa nhật ký! 🗑️");
      }
    } catch (err) {
      console.error("Failed to delete diary", err);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const getUserInfo = (authorId: string) => {
    if (!coupleData || !coupleData.users) return null;
    return coupleData.users.find((u: any) => u.UserID === authorId);
  };

  const user1 = coupleData?.users?.[0];
  const user2 = coupleData?.users?.[1];

  if (!isLoggedIn || !coupleData) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-indigo-50 dark:from-transparent dark:via-transparent dark:to-transparent p-4 pb-32">
      {/* Header */}
      <div className="text-center mb-6 pt-8">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 mb-2">
          Nhật Ký Chung
        </h1>
        <p className="text-gray-500 dark:text-white text-sm">Nơi lưu giữ những dòng tâm sự của hai người</p>
      </div>

      {/* Composer */}
      <div className="max-w-2xl mx-auto bg-white/60 dark:bg-pink-950/40 backdrop-blur-md rounded-[2rem] p-4 md:p-6 shadow-sm border border-white dark:border-pink-500/20 mb-8">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Hôm nay bạn cảm thấy thế nào?..."
          className="w-full bg-white/50 rounded-2xl p-4 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-pink-300 border-none text-gray-700 dark:text-white placeholder-gray-400"
          disabled={isSubmitting}
        />
        
        <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Mood Selector */}
          <div className="flex flex-wrap gap-2 justify-center bg-white/40 p-2 rounded-xl">
            {MOOD_EMOJIS.slice(0, 5).map(emoji => (
              <button
                key={emoji}
                onClick={() => setSelectedMood(selectedMood === emoji ? null : emoji)}
                className={`text-xl md:text-2xl w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                  selectedMood === emoji ? 'bg-pink-100 scale-125 shadow-md' : 'hover:scale-110 hover:bg-white/50 grayscale opacity-50 hover:grayscale-0 hover:opacity-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          
          {/* Post Buttons */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500 dark:text-white mr-2">Đăng bởi:</span>
            
            {user1 && (
              <button
                onClick={() => handlePost(0)}
                disabled={isSubmitting}
                className="group relative cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full border-2 border-pink-200 overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                  {user1.AvatarUrl ? (
                    <img src={user1.AvatarUrl} alt={user1.Nickname} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-pink-100 flex items-center justify-center text-xl">👩🏻</div>
                  )}
                </div>
              </button>
            )}
            
            {user2 && (
              <button
                onClick={() => handlePost(1)}
                disabled={isSubmitting}
                className="group relative cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full border-2 border-indigo-200 overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                  {user2.AvatarUrl ? (
                    <img src={user2.AvatarUrl} alt={user2.Nickname} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-xl">👨🏻</div>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-2xl mx-auto space-y-6">
        {loading ? (
          <div className="text-center text-gray-400 dark:text-white py-8 animate-pulse">Đang tải nhật ký...</div>
        ) : diaries.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-white py-12 bg-white/30 rounded-3xl border border-dashed border-pink-200">
            Chưa có bài viết nào. Hãy viết bài đầu tiên nhé!
          </div>
        ) : (
          diaries.map(diary => {
            const author = getUserInfo(diary.AuthorID);
            const isUser1 = author?.UserID === user1?.UserID;
            const dateObj = new Date(diary.CreatedAt);
            
            return (
              <div key={diary.DiaryID} className="bg-white/80 dark:bg-pink-950/50 backdrop-blur-sm rounded-3xl p-5 shadow-sm border border-white dark:border-pink-500/20 hover:shadow-md transition-shadow relative group">
                {/* Delete Button */}
                {confirmDeleteId === diary.DiaryID ? (
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-pink-50 p-1 rounded-lg shadow-sm border border-pink-200 animate-fade-in z-30">
                    <span className="text-[10px] text-pink-600 font-medium px-1">Xóa?</span>
                    <button onClick={() => executeDelete(diary.DiaryID)} className="bg-pink-500 text-white text-[10px] px-2 py-1 rounded font-bold hover:bg-pink-600 transition-colors">Có</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="bg-white text-pink-500 text-[10px] px-2 py-1 rounded font-bold border border-pink-200 hover:bg-pink-100 transition-colors">Không</button>
                  </div>
                ) : (
                  <button 
                    onClick={() => confirmDelete(diary.DiaryID)}
                    className="absolute top-4 right-4 text-pink-500 bg-pink-50 md:opacity-0 group-hover:opacity-100 transition-opacity z-20 rounded-full p-1.5 shadow-sm hover:bg-pink-100 hover:text-pink-600 border border-pink-100"
                    title="Xóa"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}

                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full p-[2px] ${isUser1 ? 'bg-gradient-to-br from-pink-400 to-rose-400' : 'bg-gradient-to-br from-indigo-400 to-purple-400'}`}>
                      <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                        {author?.AvatarUrl ? (
                          <img src={author.AvatarUrl} alt={author.Nickname} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-lg">
                            {isUser1 ? '👩🏻' : '👨🏻'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800 dark:text-white">{author?.Nickname || 'Người ẩn danh'}</span>
                      {diary.Mood && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded-full text-sm shadow-sm" title="Cảm xúc">
                          {diary.Mood}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-white mb-3">
                      {dateObj.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                    
                    <p className="text-gray-700 dark:text-white whitespace-pre-wrap leading-relaxed">
                      {diary.Content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg z-[80] animate-fade-in flex items-center gap-2">
          <span className="text-white font-medium text-sm whitespace-nowrap">{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
