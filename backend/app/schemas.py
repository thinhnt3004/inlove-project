from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional
from uuid import UUID

class UserResponse(BaseModel):
    UserID: UUID
    Nickname: Optional[str]
    AvatarUrl: Optional[str]
    Mood: Optional[str] = None
    DateOfBirth: Optional[date]

    class Config:
        from_attributes = True

class CoupleResponse(BaseModel):
    CoupleID: UUID
    LoveStartDate: datetime
    Passcode: Optional[str]
    YoutubeLink: Optional[str]
    AudioUrl: Optional[str]
    users: List[UserResponse] = []

    class Config:
        from_attributes = True
        
class CoupleCreate(BaseModel):
    love_start_date: datetime
    passcode: str

class CoupleYoutubeUpdate(BaseModel):
    youtube_link: str

class CoupleDateUpdate(BaseModel):
    love_start_date: str

class CoupleAudioUpdate(BaseModel):
    audio_url: str

class AvatarUpdate(BaseModel):
    avatar_url: str

class UserProfileUpdate(BaseModel):
    nickname: Optional[str]
    date_of_birth: Optional[date]

class UserMoodUpdate(BaseModel):
    mood: str

class RouletteOptionBase(BaseModel):
    Category: str
    Label: str

class RouletteOptionCreate(BaseModel):
    category: str
    label: str

class RouletteOptionResponse(RouletteOptionBase):
    OptionID: UUID
    CoupleID: UUID
    CreatedAt: datetime

    class Config:
        from_attributes = True

class TimeCapsuleBase(BaseModel):
    Title: str
    Message: Optional[str] = None
    OpenDate: datetime

class TimeCapsuleCreate(TimeCapsuleBase):
    Passcode: Optional[str] = None

class TimeCapsuleOpen(BaseModel):
    Passcode: Optional[str] = None

class TimeCapsuleResponse(TimeCapsuleBase):
    CapsuleID: UUID
    CoupleID: UUID
    IsOpened: bool
    CreatedAt: datetime

    class Config:
        from_attributes = True

class DiaryBase(BaseModel):
    Content: str
    Mood: Optional[str] = None

class DiaryCreate(DiaryBase):
    AuthorID: UUID

class DiaryResponse(DiaryBase):
    DiaryID: UUID
    CoupleID: UUID
    AuthorID: UUID
    CreatedAt: datetime
    
    class Config:
        from_attributes = True

class MemoryBase(BaseModel):
    Title: str
    MemoryDate: date
    Description: Optional[str] = None
    ImageUrl: Optional[str] = None

class MemoryCreate(MemoryBase):
    pass

class MemoryResponse(MemoryBase):
    MemoryID: UUID
    CoupleID: UUID
    CreatedAt: datetime
    
    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    Content: Optional[str] = None
    Reaction: Optional[str] = None
    IsDeleted: Optional[bool] = False
    ReplyToID: Optional[UUID] = None
    MediaUrl: Optional[str] = None
    MediaType: Optional[str] = None

class MessageCreate(MessageBase):
    SenderID: UUID

class MessageResponse(MessageBase):
    MessageID: UUID
    CoupleID: UUID
    SenderID: UUID
    CreatedAt: datetime
    
    class Config:
        from_attributes = True

class CountdownEventBase(BaseModel):
    Title: str
    TargetDate: datetime

class CountdownEventCreate(CountdownEventBase):
    pass

class CountdownEventResponse(CountdownEventBase):
    EventID: UUID
    CoupleID: UUID
    CreatedAt: datetime

    class Config:
        from_attributes = True

