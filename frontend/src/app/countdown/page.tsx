"use client";

import { useState, useEffect } from "react";
import { useCouple } from "@/context/CoupleContext";
import { API_BASE_URL } from "@/config";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { Clock, Plus, Trash2 } from "lucide-react";

interface CountdownEvent {
  EventID: string;
  CoupleID: string;
  Title: string;
  TargetDate: string;
  CreatedAt: string;
}

export default function CountdownPage() {
  const { coupleData, isLoggedIn } = useCouple();
  const router = useRouter();
  
  const [events, setEvents] = useState<CountdownEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [targetTime, setTargetTime] = useState("00:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Time state
  const [now, setNow] = useState(new Date().getTime());

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/");
      return;
    }
    if (coupleData) {
      fetchEvents();
    }
  }, [coupleData, isLoggedIn, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date().getTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchEvents = async () => {
    if (!coupleData) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/couple/${coupleData.CoupleID}/countdowns`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleData) return;
    if (!title || !targetDate) {
      showToast("Vui lòng nhập tên và ngày sự kiện!");
      return;
    }
    
    setIsSubmitting(true);
    // Construct local datetime string compatible with backend parsing
    // Format: YYYY-MM-DDTHH:mm:ss
    const dateTimeStr = `${targetDate}T${targetTime}:00`;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/couple/${coupleData.CoupleID}/countdowns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Title: title,
          TargetDate: dateTimeStr
        })
      });
      
      if (res.ok) {
        const newEvent = await res.json();
        setEvents([...events, newEvent].sort((a, b) => new Date(a.TargetDate).getTime() - new Date(b.TargetDate).getTime()));
        
        setTitle("");
        setTargetDate("");
        setTargetTime("00:00");
        setIsModalOpen(false);
        showToast("Đã thêm sự kiện!");
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

  const deleteEvent = async (eventId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sự kiện này?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/countdown/${eventId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setEvents(events.filter(e => e.EventID !== eventId));
        showToast("Đã xóa sự kiện!");
      }
    } catch (err) {
      console.error("Failed to delete event", err);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff69b4', '#ff1493', '#ffc0cb', '#ffffff']
    });
  };

  const renderCountdown = (targetTimeStr: string, isTopEvent: boolean) => {
    const target = new Date(targetTimeStr).getTime();
    const diff = target - now;
    
    if (diff <= 0) {
      // It's exactly time! Fire confetti once if it just turned zero (diff between 0 and -1000ms)
      if (diff > -1000 && isTopEvent) {
        triggerConfetti();
      }
      return (
        <div className="flex flex-col items-center justify-center py-4 animate-bounce">
          <span className="text-4xl">🎉</span>
          <p className="font-bold text-pink-500 text-xl mt-2">Sự kiện đã diễn ra!</p>
        </div>
      );
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const TimeBlock = ({ value, label }: { value: number, label: string }) => (
      <div className={`flex flex-col items-center justify-center bg-white/50 dark:bg-pink-950/40 rounded-xl ${isTopEvent ? 'w-16 h-16 md:w-20 md:h-20' : 'w-12 h-12 md:w-16 md:h-16'} shadow-sm border border-white/50 dark:border-pink-500/30 backdrop-blur-md`}>
        <span className={`font-black text-pink-600 dark:text-pink-300 leading-none ${isTopEvent ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
          {value.toString().padStart(2, '0')}
        </span>
        <span className={`text-pink-400 font-bold uppercase tracking-wider ${isTopEvent ? 'text-[10px] md:text-xs mt-1' : 'text-[8px] mt-0.5'}`}>
          {label}
        </span>
      </div>
    );

    return (
      <div className="flex justify-center gap-2 md:gap-4 mt-4">
        <TimeBlock value={days} label="Ngày" />
        <TimeBlock value={hours} label="Giờ" />
        <TimeBlock value={minutes} label="Phút" />
        <TimeBlock value={seconds} label="Giây" />
      </div>
    );
  };

  if (!isLoggedIn || !coupleData) return null;

  // Lọc ra các sự kiện chưa diễn ra, xếp gần nhất lên đầu
  const upcomingEvents = events
    .filter(e => new Date(e.TargetDate).getTime() > now)
    .sort((a, b) => new Date(a.TargetDate).getTime() - new Date(b.TargetDate).getTime());
    
  // Các sự kiện đã qua
  const pastEvents = events
    .filter(e => new Date(e.TargetDate).getTime() <= now)
    .sort((a, b) => new Date(b.TargetDate).getTime() - new Date(a.TargetDate).getTime());

  const topEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;
  const otherUpcomingEvents = upcomingEvents.slice(1);

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-indigo-50 dark:from-transparent dark:via-transparent dark:to-transparent p-4 pb-32 font-sans overflow-hidden">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500 mb-2 flex items-center justify-center gap-2">
          <Clock className="w-8 h-8 text-pink-500" />
          Đếm Ngược
        </h1>
        <p className="text-gray-500 dark:text-white text-sm">Cùng đếm ngược đến những ngày trọng đại</p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Top Event - The closest one */}
        {loading ? (
          <div className="text-center py-10 text-gray-400">Đang tải...</div>
        ) : topEvent ? (
          <div className="bg-white/60 dark:bg-pink-950/40 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl border border-white dark:border-pink-500/20 relative animate-fade-in group">
            <button 
              onClick={() => deleteEvent(topEvent.EventID)}
              className="absolute top-4 right-4 text-pink-300 hover:text-red-500 bg-white/50 dark:bg-black/20 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
            <div className="text-center">
              <span className="inline-block px-4 py-1 bg-gradient-to-r from-pink-400 to-rose-400 text-white text-xs font-bold rounded-full uppercase tracking-widest mb-4 shadow-sm">
                Sắp diễn ra
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white font-serif break-words">
                {topEvent.Title}
              </h2>
              <p className="text-pink-500 mt-2 font-medium">
                {new Date(topEvent.TargetDate).toLocaleString('vi-VN')}
              </p>
              
              {renderCountdown(topEvent.TargetDate, true)}
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-white/40 dark:bg-pink-950/30 rounded-3xl border border-dashed border-pink-300 dark:border-pink-500/20">
            <p className="text-gray-500 dark:text-white mb-4">Hiện không có sự kiện nào sắp tới.</p>
          </div>
        )}

        <div className="flex justify-center mt-8 mb-6">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white/80 dark:bg-pink-950/80 backdrop-blur-md text-pink-500 hover:text-white dark:text-pink-300 hover:bg-pink-500 dark:hover:bg-pink-600 font-bold py-3 px-6 rounded-full shadow-md transition-all flex items-center gap-2 border border-pink-200 dark:border-pink-500/40"
          >
            <Plus size={20} />
            Thêm Sự Kiện
          </button>
        </div>

        {/* Other Upcoming Events */}
        {otherUpcomingEvents.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-600 dark:text-pink-200 px-4">Tiếp theo</h3>
            {otherUpcomingEvents.map(event => (
              <div key={event.EventID} className="bg-white/50 dark:bg-pink-950/30 backdrop-blur-md rounded-3xl p-4 shadow-sm border border-white dark:border-pink-500/20 flex flex-col md:flex-row items-center justify-between gap-4 group relative">
                <button 
                  onClick={() => deleteEvent(event.EventID)}
                  className="absolute top-4 right-4 md:static text-pink-300 hover:text-red-500 p-2 md:p-0 transition-colors opacity-0 group-hover:opacity-100 order-3"
                >
                  <Trash2 size={16} />
                </button>
                <div className="text-center md:text-left order-1 flex-1">
                  <h4 className="font-bold text-gray-800 dark:text-white text-lg">{event.Title}</h4>
                  <p className="text-pink-500 text-sm">
                    {new Date(event.TargetDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="order-2">
                  {renderCountdown(event.TargetDate, false)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div className="space-y-4 mt-8 opacity-70 hover:opacity-100 transition-opacity">
            <h3 className="font-bold text-gray-500 dark:text-gray-400 px-4 border-b border-gray-200 dark:border-gray-700 pb-2">Sự kiện đã qua</h3>
            {pastEvents.map(event => (
              <div key={event.EventID} className="bg-gray-100/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl p-4 flex justify-between items-center group">
                <div>
                  <h4 className="font-bold text-gray-700 dark:text-gray-300 line-through decoration-gray-400">{event.Title}</h4>
                  <p className="text-gray-500 text-xs">
                    {new Date(event.TargetDate).toLocaleString('vi-VN')}
                  </p>
                </div>
                <button 
                  onClick={() => deleteEvent(event.EventID)}
                  className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-pink-950 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-pop-in border dark:border-pink-500/30">
            <div className="bg-gradient-to-r from-pink-400 to-rose-400 p-4 text-center relative">
              <h3 className="text-xl font-bold text-white">Thêm Sự Kiện Mới</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-pink-200 mb-1">Tên sự kiện</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="VD: Chuyến đi Đà Lạt, Sinh nhật..."
                  className="w-full p-3 bg-gray-50 dark:bg-slate-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-pink-200 mb-1">Ngày</label>
                  <input 
                    type="date" 
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                    required
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-pink-200 mb-1">Giờ</label>
                  <input 
                    type="time" 
                    value={targetTime}
                    onChange={e => setTargetTime(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition-colors shadow-md mt-2 disabled:opacity-50"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu Sự Kiện"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg z-[80] animate-fade-in flex items-center gap-2">
          <span className="text-white font-medium text-sm whitespace-nowrap">{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
