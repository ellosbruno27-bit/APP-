import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.notification_history import Notification_historyService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/notification_history", tags=["notification_history"])


# ---------- Pydantic Schemas ----------
class Notification_historyData(BaseModel):
    """Entity data schema (for create/update)"""
    notification_type: str
    title: str
    message: str
    lead_id: str
    priority: str
    sound_played: bool
    silenced_by_dnd: bool
    sound_type: str
    created_at: datetime


class Notification_historyUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    notification_type: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None
    lead_id: Optional[str] = None
    priority: Optional[str] = None
    sound_played: Optional[bool] = None
    silenced_by_dnd: Optional[bool] = None
    sound_type: Optional[str] = None
    created_at: Optional[datetime] = None


class Notification_historyResponse(BaseModel):
    """Entity response schema"""
    id: int
    notification_type: str
    title: str
    message: str
    lead_id: str
    priority: str
    sound_played: bool
    silenced_by_dnd: bool
    sound_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class Notification_historyListResponse(BaseModel):
    """List response schema"""
    items: List[Notification_historyResponse]
    total: int
    skip: int
    limit: int


class Notification_historyBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Notification_historyData]


class Notification_historyBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Notification_historyUpdateData


class Notification_historyBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Notification_historyBatchUpdateItem]


class Notification_historyBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Notification_historyListResponse)
async def query_notification_historys(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query notification_historys with filtering, sorting, and pagination"""
    logger.debug(f"Querying notification_historys: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Notification_historyService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
        )
        logger.debug(f"Found {result['total']} notification_historys")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying notification_historys: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Notification_historyListResponse)
async def query_notification_historys_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query notification_historys with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying notification_historys: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Notification_historyService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} notification_historys")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying notification_historys: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Notification_historyResponse)
async def get_notification_history(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single notification_history by ID"""
    logger.debug(f"Fetching notification_history with id: {id}, fields={fields}")
    
    service = Notification_historyService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Notification_history with id {id} not found")
            raise HTTPException(status_code=404, detail="Notification_history not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching notification_history {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Notification_historyResponse, status_code=201)
async def create_notification_history(
    data: Notification_historyData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new notification_history"""
    logger.debug(f"Creating new notification_history with data: {data}")
    
    service = Notification_historyService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create notification_history")
        
        logger.info(f"Notification_history created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating notification_history: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating notification_history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Notification_historyResponse], status_code=201)
async def create_notification_historys_batch(
    request: Notification_historyBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple notification_historys in a single request"""
    logger.debug(f"Batch creating {len(request.items)} notification_historys")
    
    service = Notification_historyService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} notification_historys successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Notification_historyResponse])
async def update_notification_historys_batch(
    request: Notification_historyBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple notification_historys in a single request"""
    logger.debug(f"Batch updating {len(request.items)} notification_historys")
    
    service = Notification_historyService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} notification_historys successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Notification_historyResponse)
async def update_notification_history(
    id: int,
    data: Notification_historyUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing notification_history"""
    logger.debug(f"Updating notification_history {id} with data: {data}")

    service = Notification_historyService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Notification_history with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Notification_history not found")
        
        logger.info(f"Notification_history {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating notification_history {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating notification_history {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_notification_historys_batch(
    request: Notification_historyBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple notification_historys by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} notification_historys")
    
    service = Notification_historyService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} notification_historys successfully")
        return {"message": f"Successfully deleted {deleted_count} notification_historys", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_notification_history(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single notification_history by ID"""
    logger.debug(f"Deleting notification_history with id: {id}")
    
    service = Notification_historyService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Notification_history with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Notification_history not found")
        
        logger.info(f"Notification_history {id} deleted successfully")
        return {"message": "Notification_history deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notification_history {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")