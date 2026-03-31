import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.landing_pages import Landing_pages

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Landing_pagesService:
    """Service layer for Landing_pages operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Optional[Landing_pages]:
        """Create a new landing_pages"""
        try:
            obj = Landing_pages(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created landing_pages with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating landing_pages: {str(e)}")
            raise

    async def get_by_id(self, obj_id: int) -> Optional[Landing_pages]:
        """Get landing_pages by ID"""
        try:
            query = select(Landing_pages).where(Landing_pages.id == obj_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching landing_pages {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of landing_pagess"""
        try:
            query = select(Landing_pages)
            count_query = select(func.count(Landing_pages.id))
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Landing_pages, field):
                        query = query.where(getattr(Landing_pages, field) == value)
                        count_query = count_query.where(getattr(Landing_pages, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Landing_pages, field_name):
                        query = query.order_by(getattr(Landing_pages, field_name).desc())
                else:
                    if hasattr(Landing_pages, sort):
                        query = query.order_by(getattr(Landing_pages, sort))
            else:
                query = query.order_by(Landing_pages.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching landing_pages list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any]) -> Optional[Landing_pages]:
        """Update landing_pages"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Landing_pages {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated landing_pages {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating landing_pages {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int) -> bool:
        """Delete landing_pages"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Landing_pages {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted landing_pages {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting landing_pages {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Landing_pages]:
        """Get landing_pages by any field"""
        try:
            if not hasattr(Landing_pages, field_name):
                raise ValueError(f"Field {field_name} does not exist on Landing_pages")
            result = await self.db.execute(
                select(Landing_pages).where(getattr(Landing_pages, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching landing_pages by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Landing_pages]:
        """Get list of landing_pagess filtered by field"""
        try:
            if not hasattr(Landing_pages, field_name):
                raise ValueError(f"Field {field_name} does not exist on Landing_pages")
            result = await self.db.execute(
                select(Landing_pages)
                .where(getattr(Landing_pages, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Landing_pages.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching landing_pagess by {field_name}: {str(e)}")
            raise