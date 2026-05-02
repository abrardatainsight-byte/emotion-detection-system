from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Float
from database import Base
import datetime


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String)          # "hr" or "employee"
    company = Column(String, default="EYEAI")


class EmotionLog(Base):
    """
    Stores one record per capture cycle.
    emotion_text holds the full 9-class label (not collapsed to 4).
    raw_score is the model's confidence for that label.
    """
    __tablename__ = "emotion_logs"
    id = Column(Integer, primary_key=True, index=True)
    employee_username = Column(String, ForeignKey("users.username"), index=True)
    emotion_text = Column(String)           # One of the 9 emotion labels
    raw_score = Column(Float, default=0.0)  # Model confidence 0-1
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class SystemState(Base):
    __tablename__ = "system_state"
    id = Column(Integer, primary_key=True, index=True)
    capture_requested = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
