"use client";

import { useState, useEffect, useRef } from "react";
import { useCouple } from "@/context/CoupleContext";
import { API_BASE_URL } from "@/config";

interface Message {
  MessageID: string;
  CoupleID: string;
  SenderID: string;
  Content?: string | null;
  CreatedAt: string;
  Reaction?: string | null;
  IsDeleted?: boolean;
  ReplyToID?: string | null;
  MediaUrl?: string | null;
  MediaType?: string | null;
  Action?: string;
}

const EMOJIS = ["❤️", "👍", "😆", "😢", "😡"];

export default function ChatBubble() {
  const { coupleData, isLoggedIn } = useCouple();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  
  const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
  const [showAvatarSelection, setShowAvatarSelection] = useState(false);

  // New states for advanced features
  const [replyToMsg, setReplyToMsg] = useState<Message | null>(null);
  const [msgToDelete, setMsgToDelete] = useState<string | null>(null);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  
  // Media upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSenderId = localStorage.getItem("chatSenderId");
      if (storedSenderId) setSelectedSenderId(storedSenderId);
    }
  }, []);

  useEffect(() => {
    if (isOpen && coupleData && selectedSenderId) fetchMessages();
  }, [isOpen, coupleData, selectedSenderId]);

  useEffect(() => {
    if (isOpen && coupleData && selectedSenderId) {
      // Fix for both http and https (like localtunnel or vercel)
      const wsUrl = API_BASE_URL.replace(/^https/, 'wss').replace(/^http:/, 'ws:') + `/api/ws/chat/${coupleData.CoupleID}`;
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.Action === "REACT") {
          setMessages(prev => prev.map(m => m.MessageID === data.MessageID ? { ...m, Reaction: data.Reaction } : m));
        } else if (data.Action === "DELETE") {
          setMessages(prev => prev.map(m => m.MessageID === data.MessageID ? { ...m, IsDeleted: true } : m));
        } else {
          // SEND or default
          setMessages(prev => [...prev, data as Message]);
        }
      };

      return () => ws.current?.close();
    }
  }, [isOpen, coupleData, selectedSenderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    if (!coupleData) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/couple/${coupleData.CoupleID}/messages`);
      if (res.ok) setMessages(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    if (!selectedSenderId) setShowAvatarSelection(true);
  };

  const handleSelectSender = (userId: string) => {
    setSelectedSenderId(userId);
    setShowAvatarSelection(false);
    localStorage.setItem("chatSenderId", userId);
  };

  const handleChangeUser = () => {
    localStorage.removeItem("chatSenderId");
    setSelectedSenderId(null);
    setShowAvatarSelection(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !selectedFile) || !ws.current || !selectedSenderId || isUploading) return;

    setIsUploading(true);
    let mediaUrl = null;
    let mediaType = null;

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/upload-media`, {
          method: "POST",
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          mediaUrl = data.url;
          mediaType = data.mediaType;
        } else {
          console.error("Upload failed");
          setIsUploading(false);
          return;
        }
      } catch (err) {
        console.error("Upload error", err);
        setIsUploading(false);
        return;
      }
    }

    ws.current.send(JSON.stringify({
      Action: "SEND",
      SenderID: selectedSenderId,
      Content: inputMessage.trim() || null,
      ReplyToID: replyToMsg?.MessageID || null,
      MediaUrl: mediaUrl,
      MediaType: mediaType
    }));
    
    setInputMessage("");
    setReplyToMsg(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsUploading(false);
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (ws.current) {
      ws.current.send(JSON.stringify({ Action: "REACT", MessageID: messageId, Reaction: emoji }));
    }
    setActiveActionMenu(null);
  };

  const handleDelete = (messageId: string) => {
    if (ws.current) {
      ws.current.send(JSON.stringify({ Action: "DELETE", MessageID: messageId }));
    }
    setMsgToDelete(null);
  };

  if (!isLoggedIn || !coupleData) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={handleOpenChat}
          className="fixed bottom-24 right-4 z-50 bg-pink-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform hover:bg-pink-600 animate-bounce"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 w-full sm:w-96 sm:h-[500px] bg-white sm:rounded-2xl shadow-2xl z-[60] flex flex-col overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-r from-pink-500 to-rose-400 p-4 text-white flex justify-between items-center shadow-sm z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl">💌</span>
              <h3 className="font-bold text-lg">Phòng Chat</h3>
            </div>
            <div className="flex items-center gap-3">
              {selectedSenderId && !showAvatarSelection && (
                <button onClick={handleChangeUser} className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors">
                  Đổi người
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="hover:text-pink-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {showAvatarSelection ? (
            <div className="flex-1 bg-pink-50/50 flex flex-col items-center justify-center p-6 text-center">
              <h4 className="text-gray-700 font-bold mb-6 text-lg">Ai đang sử dụng thiết bị này?</h4>
              <div className="flex gap-6 justify-center w-full">
                <button onClick={() => handleSelectSender(coupleData.users[0].UserID)} className="flex flex-col items-center gap-3 group">
                  <img src={coupleData.users[0].AvatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="User 1" className="w-20 h-20 rounded-full border-4 border-white shadow-md group-hover:scale-110 group-hover:border-pink-300 transition-all object-cover bg-white" />
                  <span className="font-medium text-gray-700 group-hover:text-pink-500">{coupleData.users[0].FullName}</span>
                </button>
                <button onClick={() => handleSelectSender(coupleData.users[1].UserID)} className="flex flex-col items-center gap-3 group">
                  <img src={coupleData.users[1].AvatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka"} alt="User 2" className="w-20 h-20 rounded-full border-4 border-white shadow-md group-hover:scale-110 group-hover:border-blue-300 transition-all object-cover bg-white" />
                  <span className="font-medium text-gray-700 group-hover:text-blue-500">{coupleData.users[1].FullName}</span>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-8 max-w-xs">Hệ thống sẽ ghi nhớ bạn trên thiết bị này.</p>
            </div>
          ) : (
            <>
              <div className="flex-1 bg-gray-50 overflow-y-auto p-4 space-y-4 relative">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                    <span className="text-4xl">💭</span>
                    <p>Hãy gửi tin nhắn đầu tiên!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.SenderID === selectedSenderId;
                    const sender = msg.SenderID === coupleData.users[0].UserID ? coupleData.users[0] : coupleData.users[1];
                    const repliedMsg = msg.ReplyToID ? messages.find(m => m.MessageID === msg.ReplyToID) : null;
                    
                    return (
                      <div key={msg.MessageID || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}>
                        {!isMe && (
                          <img src={sender.AvatarUrl || "https://api.dicebear.com/7.x/avataaars/svg"} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-200 mr-2 self-end mb-1 object-cover" />
                        )}
                        <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {/* Replied Message Preview */}
                          {repliedMsg && !msg.IsDeleted && (
                            <div className="text-xs bg-black/5 p-2 rounded-t-xl mb-[-5px] opacity-80 border-l-2 border-pink-400 w-full truncate">
                              <span className="font-semibold">{repliedMsg.SenderID === selectedSenderId ? "Bạn" : (repliedMsg.SenderID === coupleData.users[0].UserID ? coupleData.users[0].FullName : coupleData.users[1].FullName)}: </span>
                              {repliedMsg.IsDeleted ? <i className="text-gray-500">Tin nhắn đã thu hồi</i> : (repliedMsg.Content || (repliedMsg.MediaType === 'image' ? '[Hình ảnh]' : '[Video]'))}
                            </div>
                          )}

                          <div 
                            onClick={() => !msg.IsDeleted && setActiveActionMenu(activeActionMenu === msg.MessageID ? null : msg.MessageID)}
                            className={`relative rounded-2xl px-4 py-2 shadow-sm ${!msg.IsDeleted ? 'cursor-pointer hover:opacity-95' : ''} ${
                            isMe ? 'bg-pink-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                          }`}>
                            {msg.IsDeleted ? (
                              <p className="text-sm italic opacity-70">Tin nhắn đã bị thu hồi</p>
                            ) : (
                              <>
                                {/* Media Rendering */}
                                {msg.MediaUrl && (
                                  <div className="mt-1 mb-2">
                                    {msg.MediaType === 'video' ? (
                                      <video controls src={msg.MediaUrl.startsWith('http') ? msg.MediaUrl.replace('http://127.0.0.1:8080', API_BASE_URL) : `${API_BASE_URL}${msg.MediaUrl}`} className="max-w-full max-h-48 rounded-lg" />
                                    ) : (
                                      <img src={msg.MediaUrl.startsWith('http') ? msg.MediaUrl.replace('http://127.0.0.1:8080', API_BASE_URL) : `${API_BASE_URL}${msg.MediaUrl}`} alt="Sent Media" className="max-w-full max-h-48 rounded-lg object-cover" />
                                    )}
                                  </div>
                                )}
                                {/* Text Content */}
                                {msg.Content && (
                                  <p className="text-sm break-words">{msg.Content}</p>
                                )}
                              </>
                            )}

                            {/* Reaction Badge */}
                            {msg.Reaction && !msg.IsDeleted && (
                              <div className={`absolute -bottom-3 ${isMe ? 'left-0 -ml-2' : 'right-0 -mr-2'} bg-white shadow-md rounded-full px-1 text-sm border border-gray-100 text-gray-800`}>
                                {msg.Reaction}
                              </div>
                            )}
                          </div>

                          {/* Action Menu Popup */}
                          {activeActionMenu === msg.MessageID && !msg.IsDeleted && (
                            <div className={`absolute top-full mt-1 ${isMe ? 'right-0' : 'left-0'} bg-white shadow-xl rounded-2xl p-2 flex flex-col gap-2 z-30 border border-pink-100 min-w-[160px]`}>
                              <div className="flex gap-2 justify-center pb-2 border-b border-gray-100">
                                {EMOJIS.map(emoji => (
                                  <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReact(msg.MessageID, emoji); }} className="hover:scale-125 transition-transform text-xl">{emoji}</button>
                                ))}
                              </div>
                              <div className="flex flex-col text-sm text-gray-700">
                                <button onClick={(e) => { e.stopPropagation(); setReplyToMsg(msg); setActiveActionMenu(null); }} className="text-left px-2 py-1.5 hover:bg-gray-50 rounded flex items-center gap-2">
                                  <span>↩️</span> Trả lời
                                </button>
                                {isMe && (
                                  <button onClick={(e) => { e.stopPropagation(); setMsgToDelete(msg.MessageID); setActiveActionMenu(null); }} className="text-left px-2 py-1.5 hover:bg-red-50 text-red-500 rounded flex items-center gap-2">
                                    <span>🗑️</span> Thu hồi
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} className="h-2" />
              </div>

              {/* Top Banner (Reply/File Preview) */}
              <div className="bg-white px-3 flex flex-col">
                {replyToMsg && (
                  <div className="bg-pink-50 border-l-4 border-pink-400 p-2 my-2 rounded flex justify-between items-center text-sm shadow-sm">
                    <div className="truncate text-gray-600">
                      <span className="font-semibold">Đang trả lời: </span>
                      {replyToMsg.IsDeleted ? <i>Tin nhắn đã bị thu hồi</i> : (replyToMsg.Content || (replyToMsg.MediaType === 'image' ? '[Hình ảnh]' : '[Video]'))}
                    </div>
                    <button onClick={() => setReplyToMsg(null)} className="text-gray-400 hover:text-gray-600 ml-2">✖</button>
                  </div>
                )}

                {selectedFile && (
                  <div className="relative inline-block w-max mt-2">
                    {selectedFile.type.startsWith('video/') ? (
                      <video src={URL.createObjectURL(selectedFile)} className="h-20 rounded-lg shadow-sm border border-gray-200" />
                    ) : (
                      <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="h-20 rounded-lg shadow-sm border border-gray-200 object-cover" />
                    )}
                    <button type="button" onClick={() => setSelectedFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 shadow">✖</button>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-100 p-3 pb-8 sm:pb-3 flex gap-2 items-center">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-pink-500 p-1 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
                }} />

                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isUploading ? "Đang gửi file..." : "Nhắn tin..."}
                  disabled={isUploading}
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50"
                />
                
                <button 
                  type="submit"
                  disabled={(!inputMessage.trim() && !selectedFile) || isUploading}
                  className="bg-pink-500 text-white w-10 h-10 rounded-full flex shrink-0 items-center justify-center hover:bg-pink-600 disabled:opacity-50 disabled:hover:bg-pink-500 transition-colors shadow-sm"
                >
                  {isUploading ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 -ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Delete Confirmation Overlay */}
          {msgToDelete && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-5 shadow-2xl max-w-sm w-full text-center">
                <div className="text-4xl mb-3">🗑️</div>
                <h3 className="font-bold text-gray-800 mb-1">Thu hồi tin nhắn?</h3>
                <p className="text-gray-500 text-sm mb-5">Bạn có chắc chắn muốn thu hồi tin nhắn này? Người kia sẽ thấy nó bị thu hồi.</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setMsgToDelete(null)} className="px-5 py-2 rounded-full text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium transition-colors">
                    Hủy
                  </button>
                  <button onClick={() => handleDelete(msgToDelete)} className="px-5 py-2 rounded-full text-white bg-red-500 hover:bg-red-600 font-medium transition-colors">
                    Thu hồi
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
