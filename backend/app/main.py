from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict
from . import database, models, schemas
import shutil
import os
import uuid
import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
  cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
  api_key = os.environ.get('CLOUDINARY_API_KEY'),
  api_secret = os.environ.get('CLOUDINARY_API_SECRET')
)

# Đảm bảo thư mục lưu ảnh và nhạc tồn tại (có thể không dùng nữa nhưng giữ lại để tránh lỗi)
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/chat_media", exist_ok=True)
os.makedirs("music", exist_ok=True)

# Khởi tạo các bảng trong Database (nếu chưa có)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="InLove Web API")


# Cho phép Frontend gọi API không bị lỗi CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Phục vụ file tĩnh (ảnh và nhạc)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/music", StaticFiles(directory="music"), name="music")

@app.get("/")
def read_root():
    return {"message": "Chào mừng đến với InLove API! Truy cập /docs để xem danh sách API."}

@app.get("/test-db")
def test_db_connection(db: Session = Depends(database.get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Kết nối Database thành công!"}
    except Exception as e:
        return {"status": "error", "message": f"Lỗi kết nối: {str(e)}"}

@app.post("/api/couple/create", response_model=schemas.CoupleResponse)
def create_couple(data: schemas.CoupleCreate, db: Session = Depends(database.get_db)):
    # Kiểm tra mã PIN đã ai dùng chưa
    existing = db.query(models.Couple).filter(models.Couple.Passcode == data.passcode).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mã PIN này đã có người sử dụng. Hãy chọn mã 4 số khác.")
        
    new_couple = models.Couple(LoveStartDate=data.love_start_date, Passcode=data.passcode)
    db.add(new_couple)
    db.flush()
    
    # Tự động tạo 2 user cho Couple này
    user1 = models.User(CoupleID=new_couple.CoupleID, Email=f"nam_{uuid.uuid4()}@test.com", PasswordHash="123", Nickname="Nam")
    user2 = models.User(CoupleID=new_couple.CoupleID, Email=f"nu_{uuid.uuid4()}@test.com", PasswordHash="123", Nickname="Nữ")
    db.add(user1)
    db.add(user2)
    
    db.commit()
    db.refresh(new_couple)
    return new_couple

@app.get("/api/couple/login/{passcode}", response_model=schemas.CoupleResponse)
def login_couple(passcode: str, db: Session = Depends(database.get_db)):
    couple = db.query(models.Couple).filter(models.Couple.Passcode == passcode).first()
    if not couple:
        raise HTTPException(status_code=404, detail="Sai mã PIN hoặc không tồn tại!")
    return couple

@app.put("/api/couple/{couple_id}")
def update_date(couple_id: str, data: schemas.CoupleDateUpdate, db: Session = Depends(database.get_db)):
    couple = db.query(models.Couple).filter(models.Couple.CoupleID == couple_id).first()
    if not couple:
        raise HTTPException(status_code=404)
    couple.LoveStartDate = data.love_start_date
    db.commit()
    return {"status": "success"}

@app.put("/api/couple/{couple_id}/youtube")
def update_youtube(couple_id: str, data: schemas.CoupleYoutubeUpdate, db: Session = Depends(database.get_db)):
    couple = db.query(models.Couple).filter(models.Couple.CoupleID == couple_id).first()
    if not couple:
        raise HTTPException(status_code=404)
    couple.YoutubeLink = data.youtube_link
    db.commit()
    return {"status": "success"}

@app.put("/api/couple/{couple_id}/audio")
def update_audio(couple_id: str, data: schemas.CoupleAudioUpdate, db: Session = Depends(database.get_db)):
    couple = db.query(models.Couple).filter(models.Couple.CoupleID == couple_id).first()
    if not couple:
        raise HTTPException(status_code=404)
    couple.AudioUrl = data.audio_url
    db.commit()
    return {"status": "success"}

@app.post("/api/upload")
def upload_file(file: UploadFile = File(...)):
    try:
        # Upload lên Cloudinary
        result = cloudinary.uploader.upload(file.file, folder="inlove_uploads")
        # Trả về link an toàn (HTTPS) từ Cloudinary
        return {"url": result.get("secure_url")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/user/{user_id}/avatar")
def update_avatar(user_id: str, data: schemas.AvatarUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.UserID == user_id).first()
    if not user:
        raise HTTPException(status_code=404)
    user.AvatarUrl = data.avatar_url
    db.commit()
    return {"status": "success"}

@app.put("/api/user/{user_id}/profile")
def update_profile(user_id: str, data: schemas.UserProfileUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.UserID == user_id).first()
    if not user:
        raise HTTPException(status_code=404)
    if data.nickname is not None:
        user.Nickname = data.nickname
    if data.date_of_birth is not None:
        user.DateOfBirth = data.date_of_birth
    db.commit()
    return {"status": "success"}

@app.put("/api/user/{user_id}/mood")
def update_mood(user_id: str, data: schemas.UserMoodUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.UserID == user_id).first()
    if not user:
        raise HTTPException(status_code=404)
    user.Mood = data.mood
    db.commit()
    return {"status": "success"}

@app.get("/api/music")
def get_music_list():
    try:
        files = os.listdir("music")
        # Chỉ lấy các file âm thanh
        music_files = [f for f in files if f.endswith(('.mp3', '.wav', '.ogg'))]
        if not music_files:
            return {"music_list": [
                "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
            ]}
        return {"music_list": music_files}
    except Exception as e:
        return {"music_list": [
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
        ]}

@app.get("/api/couple/{couple_id}/roulette", response_model=List[schemas.RouletteOptionResponse])
def get_roulette_options(couple_id: str, db: Session = Depends(database.get_db)):
    options = db.query(models.RouletteOption).filter(models.RouletteOption.CoupleID == couple_id).all()
    if not options:
        defaults = [
            {"Category": "Ăn gì hôm nay", "Label": "Bún chả"},
            {"Category": "Ăn gì hôm nay", "Label": "Phở bò"},
            {"Category": "Ăn gì hôm nay", "Label": "Sushi"},
            {"Category": "Ăn gì hôm nay", "Label": "Lẩu nướng"},
            {"Category": "Cuối tuần đi đâu", "Label": "Xem phim"},
            {"Category": "Cuối tuần đi đâu", "Label": "Dạo phố"},
            {"Category": "Ai rửa bát", "Label": "Người yêu 1"},
            {"Category": "Ai rửa bát", "Label": "Người yêu 2"},
        ]
        for d in defaults:
            new_opt = models.RouletteOption(CoupleID=couple_id, Category=d["Category"], Label=d["Label"])
            db.add(new_opt)
        db.commit()
        options = db.query(models.RouletteOption).filter(models.RouletteOption.CoupleID == couple_id).all()
    return options

@app.post("/api/couple/{couple_id}/roulette", response_model=schemas.RouletteOptionResponse)
def create_roulette_option(couple_id: str, data: schemas.RouletteOptionCreate, db: Session = Depends(database.get_db)):
    new_opt = models.RouletteOption(CoupleID=couple_id, Category=data.category, Label=data.label)
    db.add(new_opt)
    db.commit()
    db.refresh(new_opt)
    return new_opt

@app.delete("/api/roulette/{option_id}")
def delete_roulette_option(option_id: str, db: Session = Depends(database.get_db)):
    opt = db.query(models.RouletteOption).filter(models.RouletteOption.OptionID == option_id).first()
    if opt:
        db.delete(opt)
        db.commit()
    return {"status": "success"}

# TIME CAPSULE
@app.get("/api/couple/{couple_id}/capsules", response_model=List[schemas.TimeCapsuleResponse])
def get_time_capsules(couple_id: str, db: Session = Depends(database.get_db)):
    capsules = db.query(models.TimeCapsule).filter(models.TimeCapsule.CoupleID == couple_id).order_by(models.TimeCapsule.OpenDate.asc()).all()
    # Hide message if not opened and still locked
    now = datetime.utcnow()
    for cap in capsules:
        if not cap.IsOpened:
            # If not opened, hide the message
            cap.Message = ""
    return capsules

@app.post("/api/couple/{couple_id}/capsules", response_model=schemas.TimeCapsuleResponse)
def create_time_capsule(couple_id: str, data: schemas.TimeCapsuleCreate, db: Session = Depends(database.get_db)):
    # Convert tz-aware datetime from Pydantic to naive datetime for SQL Server DATETIME column
    open_date_naive = data.OpenDate.replace(tzinfo=None) if data.OpenDate.tzinfo else data.OpenDate

    new_cap = models.TimeCapsule(
        CoupleID=couple_id,
        Title=data.Title,
        Message=data.Message,
        Passcode=data.Passcode,
        OpenDate=open_date_naive,
        IsOpened=False
    )
    db.add(new_cap)
    db.commit()
    db.refresh(new_cap)
    return new_cap

@app.post("/api/capsule/{capsule_id}/open", response_model=schemas.TimeCapsuleResponse)
def open_time_capsule(capsule_id: str, data: schemas.TimeCapsuleOpen, db: Session = Depends(database.get_db)):
    cap = db.query(models.TimeCapsule).filter(models.TimeCapsule.CapsuleID == capsule_id).first()
    if not cap:
        raise HTTPException(status_code=404, detail="Capsule not found")
    
    # Can open if time is up OR password matches
    is_time_up = datetime.utcnow() >= cap.OpenDate
    is_passcode_match = cap.Passcode and data.Passcode and cap.Passcode == data.Passcode

    if not is_time_up and not is_passcode_match:
        if data.Passcode:
            raise HTTPException(status_code=400, detail="Mật khẩu không chính xác!")
        else:
            raise HTTPException(status_code=400, detail="Chưa tới thời điểm mở khóa!")
        
    cap.IsOpened = True
    db.commit()
    db.refresh(cap)
    return cap

@app.delete("/api/capsule/{capsule_id}")
def delete_time_capsule(capsule_id: str, db: Session = Depends(database.get_db)):
    cap = db.query(models.TimeCapsule).filter(models.TimeCapsule.CapsuleID == capsule_id).first()
    if cap:
        db.delete(cap)
        db.commit()
    return {"status": "success"}

# --- DIARY ENDPOINTS ---

@app.get("/api/couple/{couple_id}/diaries", response_model=List[schemas.DiaryResponse])
def get_diaries(couple_id: str, db: Session = Depends(database.get_db)):
    couple = db.query(models.Couple).filter(models.Couple.CoupleID == couple_id).first()
    if not couple:
        raise HTTPException(status_code=404, detail="Couple not found")
    diaries = db.query(models.Diary).filter(models.Diary.CoupleID == couple_id).order_by(models.Diary.CreatedAt.desc()).all()
    return diaries

@app.post("/api/couple/{couple_id}/diaries", response_model=schemas.DiaryResponse)
def create_diary(couple_id: str, diary: schemas.DiaryCreate, db: Session = Depends(database.get_db)):
    couple = db.query(models.Couple).filter(models.Couple.CoupleID == couple_id).first()
    if not couple:
        raise HTTPException(status_code=404, detail="Couple not found")
    
    new_diary = models.Diary(
        CoupleID=couple_id,
        AuthorID=diary.AuthorID,
        Content=diary.Content,
        Mood=diary.Mood
    )
    db.add(new_diary)
    db.commit()
    db.refresh(new_diary)
    return new_diary

@app.delete("/api/diary/{diary_id}")
def delete_diary(diary_id: str, db: Session = Depends(database.get_db)):
    diary = db.query(models.Diary).filter(models.Diary.DiaryID == diary_id).first()
    if not diary:
        raise HTTPException(status_code=404, detail="Diary not found")
    db.delete(diary)
    db.commit()
    return {"status": "success"}

# --- TIMELINE / MEMORY ENDPOINTS ---

@app.get("/api/couple/{couple_id}/memories", response_model=List[schemas.MemoryResponse])
def get_memories(couple_id: str, db: Session = Depends(database.get_db)):
    couple = db.query(models.Couple).filter(models.Couple.CoupleID == couple_id).first()
    if not couple:
        raise HTTPException(status_code=404, detail="Couple not found")
    memories = db.query(models.Memory).filter(models.Memory.CoupleID == couple_id).order_by(models.Memory.MemoryDate.desc()).all()
    return memories

@app.post("/api/couple/{couple_id}/memories", response_model=schemas.MemoryResponse)
def create_memory(couple_id: str, memory: schemas.MemoryCreate, db: Session = Depends(database.get_db)):
    couple = db.query(models.Couple).filter(models.Couple.CoupleID == couple_id).first()
    if not couple:
        raise HTTPException(status_code=404, detail="Couple not found")
    
    new_memory = models.Memory(
        CoupleID=couple_id,
        Title=memory.Title,
        MemoryDate=memory.MemoryDate,
        Description=memory.Description,
        ImageUrl=memory.ImageUrl
    )
    db.add(new_memory)
    db.commit()
    db.refresh(new_memory)
    return new_memory

@app.delete("/api/memory/{memory_id}")
def delete_memory(memory_id: str, db: Session = Depends(database.get_db)):
    memory = db.query(models.Memory).filter(models.Memory.MemoryID == memory_id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    db.delete(memory)
    db.commit()
    return {"status": "success"}

# --- WEBSOCKET CHAT ---

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, couple_id: str):
        await websocket.accept()
        if couple_id not in self.active_connections:
            self.active_connections[couple_id] = []
        self.active_connections[couple_id].append(websocket)

    def disconnect(self, websocket: WebSocket, couple_id: str):
        if couple_id in self.active_connections:
            self.active_connections[couple_id].remove(websocket)
            if not self.active_connections[couple_id]:
                del self.active_connections[couple_id]

    async def broadcast(self, message: dict, couple_id: str):
        if couple_id in self.active_connections:
            for connection in self.active_connections[couple_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@app.get("/api/couple/{couple_id}/messages", response_model=List[schemas.MessageResponse])
def get_messages(couple_id: str, db: Session = Depends(database.get_db), skip: int = 0, limit: int = 50):
    messages = db.query(models.Message).filter(models.Message.CoupleID == couple_id).order_by(models.Message.CreatedAt.asc()).offset(skip).limit(limit).all()
    return messages

@app.websocket("/api/ws/chat/{couple_id}")
async def websocket_chat(websocket: WebSocket, couple_id: str, db: Session = Depends(database.get_db)):
    await manager.connect(websocket, couple_id)
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("Action", "SEND")
            
            if action == "SEND":
                sender_id = data.get("SenderID")
                content = data.get("Content")
                reply_to_id = data.get("ReplyToID")
                media_url = data.get("MediaUrl")
                media_type = data.get("MediaType")
                
                if sender_id and (content or media_url):
                    try:
                        new_msg = models.Message(
                            CoupleID=couple_id,
                            SenderID=sender_id,
                            Content=content,
                            ReplyToID=reply_to_id,
                            MediaUrl=media_url,
                            MediaType=media_type,
                            IsDeleted=False
                        )
                        db.add(new_msg)
                        db.commit()
                        db.refresh(new_msg)
                    except Exception as e:
                        db.rollback()
                        await manager.broadcast({"Action": "ERROR", "Message": str(e)}, couple_id)
                        continue
                    
                    response = {
                        "Action": "SEND",
                        "MessageID": str(new_msg.MessageID),
                        "CoupleID": str(new_msg.CoupleID),
                        "SenderID": str(new_msg.SenderID),
                        "Content": new_msg.Content,
                        "Reaction": new_msg.Reaction,
                        "IsDeleted": new_msg.IsDeleted,
                        "ReplyToID": str(new_msg.ReplyToID) if new_msg.ReplyToID else None,
                        "MediaUrl": new_msg.MediaUrl,
                        "MediaType": new_msg.MediaType,
                        "CreatedAt": new_msg.CreatedAt.isoformat() if new_msg.CreatedAt else None
                    }
                    await manager.broadcast(response, couple_id)
                    
            elif action == "REACT":
                message_id = data.get("MessageID")
                reaction = data.get("Reaction")
                msg = db.query(models.Message).filter(models.Message.MessageID == message_id).first()
                if msg:
                    msg.Reaction = reaction
                    db.commit()
                    await manager.broadcast({"Action": "REACT", "MessageID": message_id, "Reaction": reaction}, couple_id)
                    
            elif action == "DELETE":
                message_id = data.get("MessageID")
                msg = db.query(models.Message).filter(models.Message.MessageID == message_id).first()
                if msg:
                    msg.IsDeleted = True
                    db.commit()
                    await manager.broadcast({"Action": "DELETE", "MessageID": message_id}, couple_id)
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket, couple_id)

@app.post("/api/chat/upload-media")
async def upload_chat_media(file: UploadFile = File(...)):
    try:
        resource_type = "video" if file.content_type and file.content_type.startswith("video/") else "image"
        
        # Upload lên Cloudinary
        result = cloudinary.uploader.upload(
            file.file, 
            folder="inlove_chat_media",
            resource_type=resource_type
        )
        
        url = result.get("secure_url")
        return {"url": url, "mediaType": resource_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- COUNTDOWN ENDPOINTS ---

@app.get('/api/couple/{couple_id}/countdowns', response_model=List[schemas.CountdownEventResponse])
def get_countdowns(couple_id: str, db: Session = Depends(database.get_db)):
    events = db.query(models.CountdownEvent).filter(models.CountdownEvent.CoupleID == couple_id).order_by(models.CountdownEvent.TargetDate.asc()).all()
    return events

@app.post('/api/couple/{couple_id}/countdowns', response_model=schemas.CountdownEventResponse)
def create_countdown(couple_id: str, event: schemas.CountdownEventCreate, db: Session = Depends(database.get_db)):
    target_date_naive = event.TargetDate.replace(tzinfo=None) if event.TargetDate.tzinfo else event.TargetDate
    new_event = models.CountdownEvent(
        CoupleID=couple_id,
        Title=event.Title,
        TargetDate=target_date_naive
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

@app.delete('/api/countdown/{event_id}')
def delete_countdown(event_id: str, db: Session = Depends(database.get_db)):
    event = db.query(models.CountdownEvent).filter(models.CountdownEvent.EventID == event_id).first()
    if event:
        db.delete(event)
        db.commit()
    return {'status': 'success'}

