"use client";

import { useState, useEffect } from "react";
import { useCouple } from "@/context/CoupleContext";
import { API_BASE_URL } from '@/config';


interface TimeCapsule {
  CapsuleID: string;
  CoupleID: string;
  Title: string;
  Message: string;
  OpenDate: string;
  IsOpened: boolean;
  CreatedAt: string;
}

export default function TimeCapsulePage() {
  const { coupleData } = useCouple();
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<"main" | "lockedList">("main");
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [now, setNow] = useState(new Date());
  
  // Custom modal state
  const [unlockModal, setUnlockModal] = useState<{isOpen: boolean, capsuleId: string | null}>({isOpen: false, capsuleId: null});
  const [modalPasscode, setModalPasscode] = useState("");
  
  const [alertModal, setAlertModal] = useState<{isOpen: boolean, message: string, type: "success" | "error"}>({isOpen: false, message: "", type: "success"});
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{isOpen: boolean, capsuleId: string | null}>({isOpen: false, capsuleId: null});

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (coupleData) {
      fetchCapsules();
    }
  }, [coupleData]);

  const fetchCapsules = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/couple/${coupleData.CoupleID}/capsules`);
      if (res.ok) {
        const data = await res.json();
        setCapsules(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    
    const openDate = new Date(newDate);
    if (openDate <= new Date()) {
      setAlertModal({ isOpen: true, message: "Vui lòng chọn một ngày trong tương lai!", type: "error" });
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/couple/${coupleData.CoupleID}/capsules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Title: newTitle,
          Message: newMessage,
          OpenDate: openDate.toISOString(),
          Passcode: newPasscode.trim() || null
        })
      });
      if (res.ok) {
        setIsCreating(false);
        setNewTitle("");
        setNewMessage("");
        setNewDate("");
        setNewPasscode("");
        fetchCapsules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlock = async (id: string, isTimeUp: boolean = false) => {
    if (!isTimeUp) {
      setUnlockModal({ isOpen: true, capsuleId: id });
      setModalPasscode("");
      return;
    }
    await processUnlock(id, null);
  };

  const processUnlock = async (id: string, passcode: string | null) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/capsule/${id}/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Passcode: passcode })
      });
      
      if (res.ok) {
        setAlertModal({ isOpen: true, message: "🎉 Mở khóa thành công!", type: "success" });
        setUnlockModal({ isOpen: false, capsuleId: null });
        setViewMode("main");
        fetchCapsules();
      } else {
        const data = await res.json();
        setAlertModal({ isOpen: true, message: data.detail || "Không thể mở khóa!", type: "error" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteModal({ isOpen: true, capsuleId: id });
  };

  const processDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/capsule/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setConfirmDeleteModal({ isOpen: false, capsuleId: null });
        fetchCapsules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getTimeRemaining = (openDateStr: string) => {
    const target = new Date(openDateStr).getTime();
    const current = now.getTime();
    const diff = target - current;
    if (diff <= 0) return "Sẵn sàng mở!";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    if (days > 0) return `Còn ${days} ngày ${hours} giờ`;
    if (hours > 0) return `Còn ${hours} giờ ${mins} phút`;
    return `Còn ${mins} phút ${secs} giây`;
  };

  if (!coupleData) return null;

  const lockedCapsules = capsules.filter(c => !c.IsOpened).sort((a, b) => new Date(a.OpenDate).getTime() - new Date(b.OpenDate).getTime());
  const openedCapsules = capsules.filter(c => c.IsOpened).sort((a, b) => new Date(b.OpenDate).getTime() - new Date(a.OpenDate).getTime());

  const nextCapsule = lockedCapsules[0];
  const isNextReady = nextCapsule ? new Date(nextCapsule.OpenDate).getTime() <= now.getTime() : false;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-transparent dark:to-transparent p-4 pb-32">
      <div className="max-w-md mx-auto relative">
        <h1 className="text-3xl font-black text-center text-indigo-800 dark:text-white mb-2 drop-shadow-sm font-serif">
          Hộp Thời Gian ⏳
        </h1>
        <p className="text-center text-indigo-500 dark:text-white/80 mb-6 text-sm font-medium">Gửi gắm thông điệp cho tương lai</p>

        {isCreating ? (
          <form onSubmit={handleCreate} className="bg-white/60 dark:bg-pink-950/40 backdrop-blur-xl rounded-3xl shadow-xl border border-white dark:border-pink-500/20 p-6 mb-6 animate-fade-in">
            <h2 className="text-xl font-bold text-indigo-700 dark:text-white mb-4">Tạo thông điệp mới</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-white mb-1">Tiêu đề (sẽ hiển thị bên ngoài)</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Gửi em 1 năm sau..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-white mb-1">Thời điểm mở khóa</label>
                <input 
                  type="datetime-local" 
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-white mb-1">Mật khẩu bí mật (Tùy chọn)</label>
                <input 
                  type="text" 
                  value={newPasscode}
                  onChange={e => setNewPasscode(e.target.value)}
                  className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-gray-700 dark:text-white"
                  placeholder="Để trống nếu chỉ mở bằng thời gian"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-white mb-1">Nội dung thư bí mật</label>
                <textarea 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 min-h-[120px]"
                  placeholder="Điều tuyệt mật sẽ được cất giấu kỹ lưỡng..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 bg-gray-100 text-gray-600 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-500 text-white py-3 rounded-xl font-bold shadow-md shadow-indigo-200 hover:bg-indigo-600 transition-all hover:-translate-y-0.5"
                >
                  🔒 Khóa lại
                </button>
              </div>
            </div>
          </form>
        ) : (
          viewMode === "main" ? (
            <>
              <button 
                onClick={() => setIsCreating(true)}
                className="w-full bg-white/60 dark:bg-pink-950/40 backdrop-blur-md border border-white dark:border-pink-500/30 border-dashed border-2 rounded-3xl py-4 flex flex-col items-center justify-center gap-2 text-indigo-400 dark:text-pink-300 hover:text-indigo-600 dark:text-white dark:hover:text-pink-200 hover:bg-white/80 dark:hover:bg-pink-900/50 transition-all mb-6 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">➕</div>
                <span className="font-bold">Chôn cất Hộp thời gian mới</span>
              </button>

              {/* Rương Kho Báu */}
              <div className="bg-white/60 dark:bg-pink-950/40 backdrop-blur-md rounded-3xl shadow-xl border border-white dark:border-pink-500/20 p-8 mb-8 text-center relative overflow-hidden group">
                {lockedCapsules.length > 0 ? (
                  isNextReady ? (
                    <div className="animate-pulse-slow">
                      <div className="absolute inset-0 bg-gradient-to-tr from-pink-200/40 to-indigo-200/40 opacity-50 blur-xl"></div>
                      <div className="text-6xl mb-4 animate-bounce relative z-10">🎁</div>
                      <h2 className="text-2xl font-black text-indigo-700 dark:text-white mb-2 relative z-10">Một bức thư đã sẵn sàng!</h2>
                      <p className="text-sm font-medium text-indigo-600 dark:text-white mb-6 relative z-10">
                        Bức thư "{nextCapsule.Title}" đã đến lúc được mở.
                      </p>
                      <button 
                        onClick={() => handleUnlock(nextCapsule.CapsuleID, true)}
                        className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative z-10 mb-4"
                      >
                        🔓 Mở rương ngay
                      </button>
                      <button 
                        onClick={() => setViewMode("lockedList")}
                        className="text-xs font-bold text-indigo-500 dark:text-white underline hover:text-indigo-700 dark:text-white relative z-10"
                      >
                        Xem tất cả các thư đang giấu
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-6xl mb-4 opacity-80 group-hover:scale-110 transition-transform">🧰</div>
                      <h2 className="text-xl font-bold text-gray-700 dark:text-white mb-1">Rương Kỷ Niệm</h2>
                      <p className="text-sm text-gray-500 dark:text-white font-medium mb-4">
                        Đang cất giữ <span className="text-indigo-600 dark:text-white font-bold">{lockedCapsules.length}</span> bức thư bí mật
                      </p>
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 inline-block shadow-inner mb-6">
                        <p className="text-xs text-gray-400 dark:text-white mb-1">Bức thư gần nhất sẽ mở sau:</p>
                        <p className="text-lg font-bold text-indigo-500 dark:text-white font-mono tracking-wider">
                          {getTimeRemaining(nextCapsule.OpenDate)}
                        </p>
                      </div>
                      <button 
                        onClick={() => setViewMode("lockedList")}
                        className="block w-full text-sm font-bold text-indigo-500 dark:text-white border border-indigo-200 bg-indigo-50/50 py-3 rounded-xl hover:bg-indigo-100 transition-colors"
                      >
                        Xem danh sách thư đang giấu
                      </button>
                    </div>
                  )
                ) : (
                  <div className="opacity-70">
                    <div className="text-6xl mb-4 grayscale">🧰</div>
                    <h2 className="text-lg font-bold text-gray-600 dark:text-white mb-1">Rương đang trống</h2>
                    <p className="text-sm text-gray-400 dark:text-white">Hãy thêm những thông điệp cho tương lai!</p>
                  </div>
                )}
              </div>

              {/* Danh sách đã mở */}
              {openedCapsules.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-600 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">📜</span> Những lá thư đã mở
                  </h3>
                  <div className="space-y-4">
                    {openedCapsules.map(cap => (
                      <div key={cap.CapsuleID} className="bg-white/90 dark:bg-pink-950/50 backdrop-blur-xl rounded-3xl shadow-md border border-indigo-50 dark:border-pink-500/20 p-6 overflow-hidden relative group animate-fade-in">
                        <button 
                          onClick={() => handleDelete(cap.CapsuleID)}
                          className="absolute top-4 right-4 text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all z-10"
                          title="Xóa thư"
                        >
                          🗑️
                        </button>
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-50 rounded-full blur-2xl transition-colors"></div>
                        <div className="flex items-center gap-3 mb-4 relative">
                          <div className="text-3xl drop-shadow-sm">💌</div>
                          <div>
                            <h4 className="font-bold text-gray-800 dark:text-white text-lg leading-tight">{cap.Title}</h4>
                            <p className="text-xs text-gray-400 dark:text-white">Đã mở khóa ngày {new Date(cap.OpenDate).toLocaleDateString('vi-VN')}</p>
                          </div>
                        </div>
                        <div className="bg-indigo-50/50 rounded-2xl p-4 text-gray-700 dark:text-white text-sm whitespace-pre-wrap font-serif italic relative">
                          "{cap.Message}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="animate-fade-in">
              <button 
                onClick={() => setViewMode("main")}
                className="flex items-center gap-2 text-indigo-600 dark:text-white font-bold mb-6 hover:text-indigo-800 dark:text-white bg-white/50 px-4 py-2 rounded-xl backdrop-blur-sm border border-indigo-100 shadow-sm"
              >
                ⬅️ Quay lại rương chính
              </button>
              
              <h3 className="font-bold text-indigo-800 dark:text-white mb-4 flex items-center gap-2 text-lg">
                <span>🔐</span> Danh sách thư đang cất giấu
              </h3>
              
              <div className="space-y-4">
                {lockedCapsules.map(cap => {
                  const isReady = new Date(cap.OpenDate).getTime() <= now.getTime();
                  return (
                    <div key={cap.CapsuleID} className="bg-white/80 dark:bg-pink-950/40 backdrop-blur-xl rounded-3xl border border-indigo-100 dark:border-pink-500/20 p-6 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.02)_10px,rgba(0,0,0,0.02)_20px)] pointer-events-none"></div>
                      <button 
                        onClick={() => handleDelete(cap.CapsuleID)}
                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all z-10"
                        title="Xóa thư"
                      >
                        🗑️
                      </button>
                      <div className="relative">
                        <div className="flex items-start justify-between mb-4 pr-8">
                          <div className="flex gap-3">
                            <div className="text-4xl opacity-80">{isReady ? '🎁' : '🔒'}</div>
                            <div>
                              <h3 className="font-bold text-gray-700 dark:text-white text-lg">{cap.Title}</h3>
                              <p className="text-sm font-bold text-indigo-500 dark:text-white font-mono tracking-wider mt-1">
                                {getTimeRemaining(cap.OpenDate)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleUnlock(cap.CapsuleID, isReady)}
                          className={`w-full font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                            isReady 
                              ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white hover:opacity-90' 
                              : 'bg-indigo-50 text-indigo-600 dark:text-white border border-indigo-200 hover:bg-indigo-100'
                          }`}
                        >
                          {isReady ? '🔓 Mở hộp ngay' : '🔑 Nhập mật khẩu để mở sớm'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>

      {/* Unlock Passcode Modal */}
      {unlockModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm transform scale-100 animate-pop-in">
            <h3 className="text-xl font-bold text-indigo-800 dark:text-white mb-2 flex items-center gap-2">
              <span>🔐</span> Mở khóa bí mật
            </h3>
            <p className="text-sm text-gray-500 dark:text-white mb-6">
              Bức thư này chưa tới thời điểm mở. Vui lòng nhập mật khẩu để mở khóa sớm.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (unlockModal.capsuleId) {
                processUnlock(unlockModal.capsuleId, modalPasscode);
              }
            }}>
              <input
                type="password"
                placeholder="Nhập mật khẩu..."
                className="w-full bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-center text-lg font-bold text-indigo-700 dark:text-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 mb-4"
                value={modalPasscode}
                onChange={e => setModalPasscode(e.target.value)}
                autoFocus
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUnlockModal({ isOpen: false, capsuleId: null })}
                  className="flex-1 bg-gray-100 text-gray-600 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-pink-500 text-white py-3 rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity"
                >
                  Mở khóa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm transform scale-100 animate-pop-in text-center">
            <div className="text-4xl mb-4">
              {alertModal.type === "success" ? "✨" : "⚠️"}
            </div>
            <h3 className={`text-xl font-bold mb-4 ${alertModal.type === "success" ? "text-indigo-800 dark:text-white" : "text-red-600"}`}>
              {alertModal.message}
            </h3>
            <button
              onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all ${
                alertModal.type === "success" 
                  ? "bg-gradient-to-r from-indigo-500 to-pink-500 hover:opacity-90" 
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm transform scale-100 animate-pop-in text-center">
            <div className="text-4xl mb-4">🗑️</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Xóa bức thư này?</h3>
            <p className="text-sm text-gray-500 dark:text-white mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteModal({ isOpen: false, capsuleId: null })}
                className="flex-1 bg-gray-100 text-gray-600 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => confirmDeleteModal.capsuleId && processDelete(confirmDeleteModal.capsuleId)}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold shadow-md hover:bg-red-600 transition-colors"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
