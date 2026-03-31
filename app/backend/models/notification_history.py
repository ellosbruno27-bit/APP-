from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class Notification_history(Base):
    __tablename__ = "notification_history"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    notification_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    lead_id = Column(String, nullable=False)
    priority = Column(String, nullable=False)
    sound_played = Column(Boolean, nullable=False)
    silenced_by_dnd = Column(Boolean, nullable=False)
    sound_type = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)