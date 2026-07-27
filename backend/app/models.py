from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Unicode, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
import uuid
from datetime import datetime
from .database import Base

class Couple(Base):
    __tablename__ = "Couples"
    
    CoupleID = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    LoveStartDate = Column(DateTime, nullable=False)
    BackgroundUrl = Column(String(500), nullable=True)
    YoutubeLink = Column(Unicode(500), nullable=True)
    AudioUrl = Column(String(500), nullable=True)
    Passcode = Column(String(4), nullable=True)
    CreatedAt = Column(DateTime, default=datetime.now)

    # Relationships
    users = relationship("User", back_populates="couple")
    memories = relationship("Memory", back_populates="couple", cascade="all, delete-orphan")
    diaries = relationship("Diary", back_populates="couple", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "Users"
    
    UserID = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    CoupleID = Column(UNIQUEIDENTIFIER, ForeignKey("Couples.CoupleID"), nullable=True)
    Email = Column(String(255), unique=True, nullable=False)
    PasswordHash = Column(String(255), nullable=False)
    Nickname = Column(Unicode(100), nullable=True)
    AvatarUrl = Column(String(500), nullable=True)
    Mood = Column(Unicode(50), nullable=True)
    Gender = Column(String(20), nullable=True)
    DateOfBirth = Column(Date, nullable=True)
    CreatedAt = Column(DateTime, default=datetime.now)

    # Relationships
    couple = relationship("Couple", back_populates="users")
    diaries = relationship("Diary", back_populates="author")

class Memory(Base):
    __tablename__ = "Memories"
    
    MemoryID = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    CoupleID = Column(UNIQUEIDENTIFIER, ForeignKey("Couples.CoupleID"), nullable=False)
    Title = Column(Unicode(200), nullable=False)
    MemoryDate = Column(Date, nullable=False)
    Description = Column(Unicode, nullable=True) # NVARCHAR(MAX) maps to Unicode
    ImageUrl = Column(String(500), nullable=True)
    CreatedAt = Column(DateTime, default=datetime.now)

    # Relationships
    couple = relationship("Couple", back_populates="memories")

class Diary(Base):
    __tablename__ = "Diary"
    
    DiaryID = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    CoupleID = Column(UNIQUEIDENTIFIER, ForeignKey("Couples.CoupleID"), nullable=False)
    AuthorID = Column(UNIQUEIDENTIFIER, ForeignKey("Users.UserID"), nullable=False)
    Content = Column(Unicode, nullable=False) # NVARCHAR(MAX) maps to Unicode
    Mood = Column(Unicode(50), nullable=True)
    CreatedAt = Column(DateTime, default=datetime.now)

    # Relationships
    couple = relationship("Couple", back_populates="diaries")
    author = relationship("User", back_populates="diaries")

class RouletteOption(Base):
    __tablename__ = "RouletteOptions"
    
    OptionID = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    CoupleID = Column(UNIQUEIDENTIFIER, ForeignKey("Couples.CoupleID"), nullable=False)
    Category = Column(Unicode(100), nullable=False) # e.g. "Ăn gì hôm nay", "Đi đâu"
    Label = Column(Unicode(200), nullable=False)
    CreatedAt = Column(DateTime, default=datetime.now)

    # Relationships
    couple = relationship("Couple")

class TimeCapsule(Base):
    __tablename__ = "TimeCapsules"
    
    CapsuleID = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    CoupleID = Column(UNIQUEIDENTIFIER, ForeignKey("Couples.CoupleID"), nullable=False)
    Title = Column(Unicode(200), nullable=False)
    Message = Column(Unicode, nullable=True) # NVARCHAR(MAX)
    Passcode = Column(String(50), nullable=True)
    OpenDate = Column(DateTime, nullable=False)
    IsOpened = Column(Boolean, default=False)
    CreatedAt = Column(DateTime, default=datetime.now)

    # Relationships
    couple = relationship("Couple")

class Message(Base):
    __tablename__ = "Messages"
    
    MessageID = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    CoupleID = Column(UNIQUEIDENTIFIER, ForeignKey("Couples.CoupleID"), nullable=False)
    SenderID = Column(UNIQUEIDENTIFIER, ForeignKey("Users.UserID"), nullable=False)
    Content = Column(Unicode, nullable=True) # Allow null if message is only media
    Reaction = Column(Unicode(50), nullable=True)
    IsDeleted = Column(Boolean, default=False)
    ReplyToID = Column(UNIQUEIDENTIFIER, ForeignKey("Messages.MessageID"), nullable=True)
    MediaUrl = Column(Unicode, nullable=True)
    MediaType = Column(Unicode(50), nullable=True)
    CreatedAt = Column(DateTime, default=datetime.now)

class CountdownEvent(Base):
    __tablename__ = 'CountdownEvents'

    EventID = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    CoupleID = Column(UNIQUEIDENTIFIER, ForeignKey('Couples.CoupleID'), nullable=False)
    Title = Column(Unicode(200), nullable=False)
    TargetDate = Column(DateTime, nullable=False)
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    couple = relationship('Couple')

