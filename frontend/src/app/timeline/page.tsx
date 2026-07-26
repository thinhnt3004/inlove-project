"use client";

import { useState, useEffect, useRef } from "react";
import { useCouple } from "@/context/CoupleContext";
import { API_BASE_URL } from "@/config";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

interface Memory {
  MemoryID: string;
  CoupleID: string;
  Title: string;
  MemoryDate: string;
  Description: string | null;
  ImageUrl: string | null;
  CreatedAt: string;
}

export default function TimelinePage() {
  const { coupleData, isLoggedIn } = useCouple();
  const router = useRouter();
  
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // New features state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hearts, setHearts] = useState<{ id: number; memoryId: string; x: number; drift: number }[]>([]);
  const heartCounter = useRef(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/");
      return;
    }
    
    if (coupleData) {
      fetchMemories();
    }
  }, [coupleData, isLoggedIn, router]);

  const fetchMemories = async () => {
    if (!coupleData) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/couple/${coupleData.CoupleID}/memories`);
      if (res.ok) {
        const data = await res.json();
        const processedData = data.map((m: any) => {
          let url = m.ImageUrl;
          if (url) {
            url = url.replace('http://127.0.0.1:8080', '');
            if (url.startsWith('/uploads')) url = API_BASE_URL + url;
          }
          return { ...m, ImageUrl: url };
        });
        setMemories(processedData);
      }
    } catch (err) {
      console.error("Failed to fetch memories", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Preview immediately
    const tempUrl = URL.createObjectURL(file);
    setImageUrl(tempUrl);

    // Upload to server
    const formData = new FormData();
    formData.append("file", file);
    try {
      showToast("Đang tải ảnh lên...");
      const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        setImageUrl(uploadData.url); // Use actual server URL
        showToast("Tải ảnh thành công!");
      } else {
        showToast("Lỗi tải ảnh!");
        setImageUrl(null);
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối tải ảnh!");
      setImageUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleData) return;
    if (!title || !date) {
      showToast("Vui lòng nhập tên kỷ niệm và ngày!");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/couple/${coupleData.CoupleID}/memories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Title: title,
          MemoryDate: date,
          Description: description,
          ImageUrl: imageUrl
        })
      });
      
      if (res.ok) {
        let newMemory = await res.json();
        if (newMemory.ImageUrl && newMemory.ImageUrl.startsWith('/uploads')) {
          newMemory.ImageUrl = API_BASE_URL + newMemory.ImageUrl;
        }
        // Insert and sort
        const newMemories = [...memories, newMemory].sort((a, b) => new Date(b.MemoryDate).getTime() - new Date(a.MemoryDate).getTime());
        setMemories(newMemories);
        
        // Reset form
        setTitle("");
        setDate("");
        setDescription("");
        setImageUrl(null);
        setIsModalOpen(false);
        showToast("Đã lưu kỷ niệm! 🎉");
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

  const confirmDelete = (memoryId: string) => {
    setConfirmDeleteId(memoryId);
  };

  const executeDelete = async (memoryId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/memory/${memoryId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setMemories(memories.filter(m => m.MemoryID !== memoryId));
        showToast("Đã xóa kỷ niệm! 🗑️");
      }
    } catch (err) {
      console.error("Failed to delete memory", err);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleReactHeart = (memoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const id = heartCounter.current++;
    const x = (Math.random() - 0.5) * 40; // drift offset
    const drift = (Math.random() - 0.5) * 40;
    
    setHearts(prev => [...prev, { id, memoryId, x, drift }]);
    
    // Remove heart after 1s
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, 1000);
  };

  if (!isLoggedIn || !coupleData) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-indigo-50 dark:from-transparent dark:via-transparent dark:to-transparent p-4 pb-32 font-sans overflow-hidden">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500 mb-2">
          Dòng Thời Gian
        </h1>
        <p className="text-gray-500 dark:text-white text-sm">Lưu giữ những cột mốc đáng nhớ nhất</p>
      </div>

      <div className="max-w-2xl mx-auto flex justify-center mb-10">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white/80 dark:bg-pink-950/80 backdrop-blur-md text-pink-500 hover:text-white dark:text-pink-300 hover:bg-pink-500 dark:hover:bg-pink-600 font-bold py-3 px-6 rounded-full shadow-md transition-all flex items-center gap-2 border border-pink-200 dark:border-pink-500/40"
        >
          <span className="text-xl">+</span> Thêm Kỷ Niệm
        </button>
      </div>

      {/* Timeline List */}
      <div className="max-w-4xl mx-auto relative px-4 md:px-0">
        {/* The vertical line */}
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-pink-200 dark:bg-pink-500/50 rounded-full z-0 md:-ml-0.5"></div>

        {loading ? (
          <div className="text-center text-gray-400 dark:text-white py-8 animate-pulse ml-12 md:ml-0">Đang tải kỷ niệm...</div>
        ) : memories.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-pink-200/60 py-12 ml-12 md:ml-0 md:w-1/2 md:mx-auto bg-white/30 dark:bg-pink-950/30 rounded-3xl border border-dashed border-pink-200 dark:border-pink-500/20">
            Chưa có kỷ niệm nào được lưu.
          </div>
        ) : (
          <div className="space-y-12">
            {memories.map((memory, index) => {
              const memoryDate = new Date(memory.MemoryDate);
              const isEven = index % 2 === 0;
              
              return (
                <div key={memory.MemoryID} className={`relative z-10 flex flex-col md:flex-row items-center justify-between group ${isEven ? 'md:flex-row-reverse' : ''}`}>
                  
                  {/* Empty space for alternating layout */}
                  <div className="hidden md:block md:w-5/12"></div>
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-4 md:static md:w-2/12 flex justify-center z-20">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-pink-500 rounded-full border-4 border-white dark:border-pink-950 shadow-sm group-hover:scale-125 transition-transform shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                  </div>
                  
                  {/* Memory Card */}
                  <div className={`w-full pl-12 md:pl-0 md:w-5/12 flex ${isEven ? 'md:justify-start' : 'md:justify-end'}`}>
                    <div className="w-full bg-white dark:bg-pink-950/60 p-4 rounded-3xl shadow-xl dark:border dark:border-pink-500/20 relative transform group-hover:-translate-y-1 transition-all duration-300">
                      
                      {/* Delete logic */}
                      {confirmDeleteId === memory.MemoryID ? (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-pink-50 p-1 rounded-lg shadow-sm border border-pink-200 animate-fade-in z-30">
                          <span className="text-[10px] text-pink-600 font-medium px-1">Xóa?</span>
                          <button onClick={() => executeDelete(memory.MemoryID)} className="bg-pink-500 text-white text-[10px] px-2 py-1 rounded font-bold hover:bg-pink-600 transition-colors">Có</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="bg-white text-pink-500 text-[10px] px-2 py-1 rounded font-bold border border-pink-200 hover:bg-pink-100 transition-colors">Không</button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => confirmDelete(memory.MemoryID)}
                          className="absolute top-2 right-2 text-pink-500 bg-white md:opacity-0 group-hover:opacity-100 transition-opacity z-20 rounded-full p-1.5 shadow-sm hover:bg-pink-100 border border-pink-100"
                          title="Xóa"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}

                      {/* Image Area */}
                      {memory.ImageUrl && (
                        <div 
                          className="w-full aspect-video md:aspect-square bg-gray-100 mb-4 overflow-hidden rounded-2xl relative cursor-pointer group/img"
                          onClick={() => setSelectedImage(memory.ImageUrl)}
                        >
                          <img src={memory.ImageUrl} alt={memory.Title} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover/img:opacity-100 font-bold tracking-widest drop-shadow-md">PHÓNG TO</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Content Area */}
                      <div className="px-2">
                        <h3 className="font-bold text-gray-800 dark:text-white text-xl mb-1 font-serif">{memory.Title}</h3>
                        <p className="text-pink-500 font-medium text-sm mb-3">
                          {memoryDate.toLocaleDateString('vi-VN')}
                        </p>
                        {memory.Description && (
                          <p className="text-gray-600 dark:text-white text-sm italic border-l-2 border-pink-200 pl-3">"{memory.Description}"</p>
                        )}
                        
                        {/* Reaction Button */}
                        <div className="mt-4 flex justify-end relative">
                          <button 
                            onClick={(e) => handleReactHeart(memory.MemoryID, e)}
                            className="bg-pink-50 text-pink-500 dark:bg-pink-900/50 dark:text-pink-300 p-2 rounded-full hover:bg-pink-100 dark:hover:bg-pink-900 transition-colors active:scale-90"
                            title="Thả tim"
                          >
                            <Heart size={20} className="fill-pink-500" />
                          </button>
                          
                          {/* Flying Hearts Animation Container */}
                          {hearts.filter(h => h.memoryId === memory.MemoryID).map(h => (
                            <div 
                              key={h.id} 
                              className="absolute bottom-8 right-2 text-2xl animate-float-up pointer-events-none"
                              style={{
                                transform: `translateX(${h.x}px) rotate(${h.drift}deg)`
                              }}
                            >
                              ❤️
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Memory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-pop-in">
            <div className="bg-gradient-to-r from-pink-400 to-rose-400 p-4 text-center relative">
              <h3 className="text-xl font-bold text-white">Thêm Kỷ Niệm Mới</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Tên kỷ niệm / Sự kiện</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="VD: Chuyến đi Đà Lạt đầu tiên"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Ngày diễn ra</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Hình ảnh (Tùy chọn)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50 hover:border-pink-300 transition-colors relative overflow-hidden"
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <span className="text-2xl mb-1">📸</span>
                      <span className="text-sm text-gray-500 dark:text-white font-medium">Bấm để tải ảnh lên</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Mô tả thêm (Tùy chọn)</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ghi chú lại cảm xúc, chi tiết..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 min-h-[80px]"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition-colors shadow-md mt-2 disabled:opacity-50"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu Kỷ Niệm"}
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

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Phóng to" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-pop-in" 
          />
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white hover:bg-white/10 p-3 rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
          >
            ✕ Đóng
          </button>
        </div>
      )}
    </main>
  );
}
