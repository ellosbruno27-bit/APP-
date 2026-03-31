import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.notification_history import Notification_history

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Notification_historyService:
    """Service layer for Notification_history operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Optional[Notification_history]:
        """Create a new notification_history"""
        try:
            obj = Notification_history(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created notification_history with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating notification_history: {str(e)}")
            raise

    async def get_by_id(self, obj_id: int) -> Optional[Notification_history]:
        """Get notification_history by ID"""
        try:
            query = select(Notification_history).where(Notification_history.id == obj_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching notification_history {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of notification_historys"""
        try:
            query = select(Notification_history)
            count_query = select(func.count(Notification_history.id))
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Notification_history, field):
                        query = query.where(getattr(Notification_history, field) == value)
                        count_query = count_query.where(getattr(Notification_history, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Notification_history, field_name):
                        query = query.order_by(getattr(Notification_history, field_name).desc())
                else:
                    if hasattr(Notification_history, sort):
                        query = query.order_by(getattr(Notification_history, sort))
            else:
                query = query.order_by(Notification_history.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching notification_history list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any]) -> Optional[Notification_history]:
        """Update notification_history"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Notification_history {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated notification_history {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating notification_history {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int) -> bool:
        """Delete notification_history"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Notification_history {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted notification_history {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting notification_history {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Notification_history]:
        """Get notification_history by any field"""
        try:
            if not hasattr(Notification_history, field_name):
                raise ValueError(f"Field {field_name} does not exist on Notification_history")
            result = await self.db.execute(
                select(Notification_history).where(getattr(Notification_history, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching notification_history by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Notification_history]:
        """Get list of notification_historys filtered by field"""
        try:
            if not hasattr(Notification_history, field_name):
                raise ValueError(f"Field {field_name} does not exist on Notification_history")
            result = await self.db.execute(
                select(Notification_history)
                .where(getattr(Notification_history, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Notification_history.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching notification_historys by {field_name}: {str(e)}")
            raise