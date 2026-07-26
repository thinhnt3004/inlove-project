"use client";

import { useState, useEffect, useRef } from "react";
import { useCouple } from "@/context/CoupleContext";
import { API_BASE_URL } from '@/config';


export default function MusicPlayer() {
  const { coupleData } = useCouple();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [audioUrl, setAudioUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicList, setMusicList] = useState<string[]>([]);
  const [showPlaylist, setShowPlaylist] = useState(false);
  
  useEffect(() => {
    if (coupleData?.AudioUrl) {
      setAudioUrl(coupleData.AudioUrl);
    } else {
      setAudioUrl("");
    }
    
    fetch(`${API_BASE_URL}/api/music`)
      .then(r => r.json())
      .then(d => {
         if (d.music_list) setMusicList(d.music_list);
      })
      .catch(e => console.error(e));
      
    // Auto play when layout mounts if there is an audio url
    if (coupleData?.AudioUrl) {
      setIsPlaying(true);
      setTimeout(() => {
        if (audioRef.current && coupleData.AudioUrl) {
          audioRef.current.play().catch(e => {
            console.error("Auto play blocked:", e);
            setIsPlaying(false);
          });
        }
      }, 500);
    } else {
      setIsPlaying(false);
    }
  }, [coupleData]);
  
  const handleSelectSong = async (songName: string) => {
    if (!coupleData) return;
    const url = `${API_BASE_URL}/music/${songName}`;
    setAudioUrl(url);
    setShowPlaylist(false);
    setIsPlaying(true);
    setTimeout(() => { audioRef.current?.play(); }, 100);

    try {
      await fetch(`${API_BASE_URL}/api/couple/${coupleData.CoupleID}/audio`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio_url: url })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play().then(() => setIsPlaying(true)).catch(e => console.error(e));
    }
  };

  const handleSongEnded = () => {
    if (musicList.length === 0 || !audioUrl) return;
    const currentSongName = decodeURIComponent(audioUrl.split('/').pop() || "");
    const currentIndex = musicList.indexOf(currentSongName);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % musicList.length;
      handleSelectSong(musicList[nextIndex]);
    }
  };

  if (!coupleData) return null;

  return (
    <div className="relative flex flex-col items-end gap-1">
      {showPlaylist && (
        <div className="absolute top-12 right-0 bg-white/95 p-3 rounded-xl shadow-lg border border-pink-100 max-h-40 overflow-y-auto min-w-[160px] animate-fade-in z-50">
          <h3 className="text-pink-600 font-bold mb-1 text-[11px] border-b pb-1 uppercase tracking-wider">Danh sách nhạc</h3>
          {musicList.length === 0 ? (
            <p className="text-[10px] text-gray-500">Chưa có bài hát nào.<br/>Hãy copy file mp3 vào thư mục backend/music/</p>
          ) : (
            <ul className="space-y-1 mt-2">
              {musicList.map((song, idx) => (
                <li 
                  key={idx} 
                  onClick={() => handleSelectSong(song)}
                  className="text-xs text-gray-700 hover:text-pink-600 hover:bg-pink-50 p-1.5 rounded cursor-pointer truncate max-w-[150px] transition-colors"
                  title={song}
                >
                  🎵 {song}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex items-center h-8 bg-white/70 backdrop-blur-md px-1.5 rounded-full shadow border border-pink-100 gap-1 hover:bg-white transition-colors">
         <button 
           onClick={togglePlay} 
           className={`w-6 h-6 flex flex-shrink-0 items-center justify-center rounded-full border border-pink-200 bg-white text-pink-500 cursor-pointer shadow-sm transition-all hover:bg-pink-50 ${isPlaying ? 'heart-beat bg-pink-100 text-pink-600 border-pink-300' : 'opacity-80'}`}
           title={isPlaying ? "Tạm dừng" : "Phát nhạc"}
         >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
           </svg>
         </button>
         <button 
           onClick={() => setShowPlaylist(!showPlaylist)} 
           className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-pink-500 rounded-full hover:bg-pink-50 transition-colors"
           title="Danh sách nhạc"
         >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
           </svg>
         </button>
      </div>
      
      <audio 
        ref={audioRef} 
        src={audioUrl || undefined} 
        className="hidden" 
        onEnded={handleSongEnded}
      />
    </div>
  );
}
