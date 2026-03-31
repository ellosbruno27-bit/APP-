import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.bancos import Bancos

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class BancosService:
    """Service layer for Bancos operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Optional[Bancos]:
        """Create a new bancos"""
        try:
            obj = Bancos(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created bancos with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating bancos: {str(e)}")
            raise

    async def get_by_id(self, obj_id: int) -> Optional[Bancos]:
        """Get bancos by ID"""
        try:
            query = select(Bancos).where(Bancos.id == obj_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching bancos {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of bancoss"""
        try:
            query = select(Bancos)
            count_query = select(func.count(Bancos.id))
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Bancos, field):
                        query = query.where(getattr(Bancos, field) == value)
                        count_query = count_query.where(getattr(Bancos, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Bancos, field_name):
                        query = query.order_by(getattr(Bancos, field_name).desc())
                else:
                    if hasattr(Bancos, sort):
                        query = query.order_by(getattr(Bancos, sort))
            else:
                query = query.order_by(Bancos.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching bancos list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any]) -> Optional[Bancos]:
        """Update bancos"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Bancos {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated bancos {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating bancos {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int) -> bool:
        """Delete bancos"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Bancos {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted bancos {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting bancos {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Bancos]:
        """Get bancos by any field"""
        try:
            if not hasattr(Bancos, field_name):
                raise ValueError(f"Field {field_name} does not exist on Bancos")
            result = await self.db.execute(
                select(Bancos).where(getattr(Bancos, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching bancos by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Bancos]:
        """Get list of bancoss filtered by field"""
        try:
            if not hasattr(Bancos, field_name):
                raise ValueError(f"Field {field_name} does not exist on Bancos")
            result = await self.db.execute(
                select(Bancos)
                .where(getattr(Bancos, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Bancos.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching bancoss by {field_name}: {str(e)}")
            raise