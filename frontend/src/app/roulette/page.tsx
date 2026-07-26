"use client";

import { useState, useEffect, useRef } from "react";
import { useCouple } from "@/context/CoupleContext";

import confetti from "canvas-confetti";
import { API_BASE_URL } from '@/config';


interface RouletteOption {
  OptionID: string;
  Category: string;
  Label: string;
}

const COLORS = ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#e0baff', '#ffb3e6'];

// Web Audio API Helpers
let globalAudioCtx: AudioContext | null = null;
const getAudioCtx = () => {
  if (typeof window === 'undefined') return null;
  if (!globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
  return globalAudioCtx;
};

const playTick = () => {
  try {
    const audioCtx = getAudioCtx();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch(e) {}
}

const playTada = () => {
  try {
    const audioCtx = getAudioCtx();
    if (!audioCtx) return;
    
    const playChord = (freqs: number[], startTime: number, duration: number) => {
      freqs.forEach(freq => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const rampUp = duration > 0.2 ? 0.1 : duration * 0.3;
        const rampDown = duration > 0.2 ? 0.2 : duration * 0.3;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + rampUp);
        gainNode.gain.setValueAtTime(0.2, startTime + duration - rampDown);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    }

    playChord([261.63, 329.63, 392.00], audioCtx.currentTime, 0.15);
    playChord([523.25, 659.25, 783.99], audioCtx.currentTime + 0.2, 0.8);
  } catch(e) {}
}

export default function RoulettePage() {
  const { coupleData } = useCouple();
  const [options, setOptions] = useState<RouletteOption[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    if (coupleData) {
      fetchOptions();
    }
  }, [coupleData]);

  const fetchOptions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/couple/${coupleData.CoupleID}/roulette`);
      if (res.ok) {
        const data: RouletteOption[] = await res.json();
        setOptions(data);
        const cats = Array.from(new Set(data.map(d => d.Category)));
        setCategories(cats);
        if (cats.length > 0 && !activeCategory) {
          setActiveCategory(cats[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const cat = isAddingCategory ? newCategory.trim() : activeCategory;
    if (!cat) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/couple/${coupleData.CoupleID}/roulette`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat, label: newLabel })
      });
      if (res.ok) {
        setNewLabel("");
        if (isAddingCategory) {
          setNewCategory("");
          setIsAddingCategory(false);
          setActiveCategory(cat);
        }
        fetchOptions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/roulette/${id}`, { method: "DELETE" });
      if (res.ok) fetchOptions();
    } catch (err) {
      console.error(err);
    }
  };

  const activeOptions = options.filter(o => o.Category === activeCategory);
  
  const spinWheel = () => {
    if (isSpinning || activeOptions.length === 0) return;
    setIsSpinning(true);
    setWinner(null);
    
    // Ticking sound logic
    let ticks = 0;
    const maxTicks = 40;
    const tickInterval = () => {
      if (ticks >= maxTicks) return;
      playTick();
      ticks++;
      const delay = 20 + Math.pow(ticks, 1.6);
      setTimeout(tickInterval, delay);
    };
    tickInterval();

    const sliceAngle = 360 / activeOptions.length;
    const extraSpins = 5 * 360;
    const winnerIndex = Math.floor(Math.random() * activeOptions.length);
    const currentRotMod = rotation % 360;
    const winnerCenter = (winnerIndex * sliceAngle) + (sliceAngle / 2);
    
    const targetBase = 360 - winnerCenter;
    const totalRotation = rotation + extraSpins + (targetBase - currentRotMod) + (currentRotMod > targetBase ? 360 : 0);

    setRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(activeOptions[winnerIndex].Label);
      playTada();
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff']
      });
    }, 5000);
  };

  // Generate Conic Gradient
  const sliceAngle = 360 / (activeOptions.length || 1);
  const conicGradient = activeOptions.map((opt, i) => {
    const start = i * sliceAngle;
    const end = start + sliceAngle;
    return `${COLORS[i % COLORS.length]} ${start}deg ${end}deg`;
  }).join(", ");

  if (!coupleData) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 to-red-50 dark:from-transparent dark:to-transparent p-4 pb-32">
      <div className="max-w-md mx-auto bg-white/40 dark:bg-pink-950/40 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white dark:border-pink-500/20 p-6 relative overflow-hidden">
        
        {/* Tiêu đề */}
        <h1 className="text-3xl font-black text-center text-pink-600 mb-6 drop-shadow-sm font-serif">Vòng Quay Định Mệnh</h1>
        
        {/* Tabs Chủ Đề */}
        <div className="flex overflow-x-auto gap-2 pb-2 mb-6 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                activeCategory === cat ? "bg-pink-500 text-white shadow-md scale-105" : "bg-white text-gray-600 hover:bg-pink-100"
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => setIsAddingCategory(!isAddingCategory)}
            className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold bg-white text-pink-500 border border-pink-200 hover:bg-pink-50"
          >
            + Chủ đề
          </button>
        </div>

        {/* Bánh xe */}
        <div className="relative w-64 h-64 mx-auto my-8">
          {/* Kim chỉ thị */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-4xl drop-shadow-md">👇</div>
          
          {activeOptions.length > 0 ? (
            <div className="w-full h-full rounded-full border-4 border-white shadow-xl relative overflow-hidden bg-gray-100">
              <div 
                className="w-full h-full rounded-full transition-transform ease-[cubic-bezier(0.2,0.8,0.2,1)] duration-[5000ms]"
                style={{
                  background: `conic-gradient(${conicGradient})`,
                  transform: `rotate(${rotation}deg)`
                }}
              >
                {activeOptions.map((opt, i) => {
                  const angle = (i * sliceAngle) + (sliceAngle / 2);
                  return (
                    <div 
                      key={opt.OptionID}
                      className="absolute w-full h-full flex items-center justify-center text-gray-800 font-bold text-sm"
                      style={{
                        transform: `rotate(${angle - 90}deg)`,
                      }}
                    >
                      <span 
                        className="block w-24 text-right truncate pr-2 drop-shadow-sm"
                        style={{ transform: `translateX(3.5rem)` }}
                      >
                        {opt.Label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="w-full h-full rounded-full border-4 border-dashed border-pink-200 flex items-center justify-center text-gray-500 text-sm text-center p-4 bg-white/50">
              Chưa có lựa chọn nào.<br/>Hãy thêm ở bên dưới nhé!
            </div>
          )}
          
          {/* Nút SPIN ở giữa */}
          <button 
            onClick={spinWheel}
            disabled={isSpinning || activeOptions.length === 0}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg border-4 border-pink-100 flex items-center justify-center font-black text-pink-600 transition-transform ${isSpinning ? 'scale-90 cursor-not-allowed opacity-80' : 'hover:scale-110 active:scale-95'}`}
          >
            QUAY
          </button>
        </div>

        {/* Kết quả bật lên */}
        {winner && !isSpinning && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 rounded-[3rem]">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-xl text-gray-600 dark:text-white font-medium">Kết quả là:</h2>
            <p className="text-4xl font-black text-pink-600 my-4 text-center px-4 leading-tight">{winner}</p>
            <button 
              onClick={() => setWinner(null)}
              className="mt-6 bg-pink-500 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-pink-600"
            >
              Chấp nhận số phận
            </button>
          </div>
        )}

        {/* Quản lý danh sách */}
        <div className="mt-8 bg-white/60 dark:bg-pink-950/30 p-4 rounded-2xl">
          <h3 className="font-bold text-gray-700 dark:text-gray-100 mb-3 flex items-center justify-between">
            <span>Danh sách lựa chọn</span>
            <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full">{activeOptions.length} ô</span>
          </h3>
          
          <ul className="max-h-40 overflow-y-auto space-y-2 mb-4 scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent pr-2">
            {activeOptions.map(opt => (
              <li key={opt.OptionID} className="flex items-center justify-between bg-white p-2 rounded-xl shadow-sm border border-gray-50">
                <span className="text-gray-700 text-sm font-medium">{opt.Label}</span>
                <button 
                  onClick={() => handleDelete(opt.OptionID)}
                  className="bg-red-50 text-red-400 hover:bg-red-500 hover:text-white w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm text-xs font-bold"
                  title="Xóa"
                >
                  X
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={handleAddOption} className="flex flex-col gap-2">
            {isAddingCategory ? (
              <input 
                type="text" 
                placeholder="Tên chủ đề mới..." 
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full bg-white border border-pink-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-pink-500"
                autoFocus
              />
            ) : null}
            <div className="flex gap-2 w-full">
              <input 
                type="text" 
                placeholder="Thêm lựa chọn mới..." 
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                className="flex-1 bg-white border border-pink-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-pink-500"
              />
              <button 
                type="submit"
                className="bg-pink-500 text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-pink-600 flex-shrink-0"
              >
                +
              </button>
            </div>
          </form>
        </div>
        
      </div>
    </main>
  );
}
