import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.afiliados import Afiliados

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class AfiliadosService:
    """Service layer for Afiliados operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Optional[Afiliados]:
        """Create a new afiliados"""
        try:
            obj = Afiliados(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created afiliados with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating afiliados: {str(e)}")
            raise

    async def get_by_id(self, obj_id: int) -> Optional[Afiliados]:
        """Get afiliados by ID"""
        try:
            query = select(Afiliados).where(Afiliados.id == obj_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching afiliados {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of afiliadoss"""
        try:
            query = select(Afiliados)
            count_query = select(func.count(Afiliados.id))
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Afiliados, field):
                        query = query.where(getattr(Afiliados, field) == value)
                        count_query = count_query.where(getattr(Afiliados, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Afiliados, field_name):
                        query = query.order_by(getattr(Afiliados, field_name).desc())
                else:
                    if hasattr(Afiliados, sort):
                        query = query.order_by(getattr(Afiliados, sort))
            else:
                query = query.order_by(Afiliados.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching afiliados list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any]) -> Optional[Afiliados]:
        """Update afiliados"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Afiliados {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated afiliados {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating afiliados {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int) -> bool:
        """Delete afiliados"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Afiliados {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted afiliados {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting afiliados {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Afiliados]:
        """Get afiliados by any field"""
        try:
            if not hasattr(Afiliados, field_name):
                raise ValueError(f"Field {field_name} does not exist on Afiliados")
            result = await self.db.execute(
                select(Afiliados).where(getattr(Afiliados, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching afiliados by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Afiliados]:
        """Get list of afiliadoss filtered by field"""
        try:
            if not hasattr(Afiliados, field_name):
                raise ValueError(f"Field {field_name} does not exist on Afiliados")
            result = await self.db.execute(
                select(Afiliados)
                .where(getattr(Afiliados, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Afiliados.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching afiliadoss by {field_name}: {str(e)}")
            raise