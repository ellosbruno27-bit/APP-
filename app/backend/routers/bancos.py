import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.bancos import BancosService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/bancos", tags=["bancos"])


# ---------- Pydantic Schemas ----------
class BancosData(BaseModel):
    """Entity data schema (for create/update)"""
    ref_id: str
    nome: str
    cor: str
    ativo: bool
    created_at: Optional[datetime] = None


class BancosUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    ref_id: Optional[str] = None
    nome: Optional[str] = None
    cor: Optional[str] = None
    ativo: Optional[bool] = None
    created_at: Optional[datetime] = None


class BancosResponse(BaseModel):
    """Entity response schema"""
    id: int
    ref_id: str
    nome: str
    cor: str
    ativo: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BancosListResponse(BaseModel):
    """List response schema"""
    items: List[BancosResponse]
    total: int
    skip: int
    limit: int


class BancosBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[BancosData]


class BancosBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: BancosUpdateData


class BancosBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[BancosBatchUpdateItem]


class BancosBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=BancosListResponse)
async def query_bancoss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query bancoss with filtering, sorting, and pagination"""
    logger.debug(f"Querying bancoss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = BancosService(db)
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
        logger.debug(f"Found {result['total']} bancoss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying bancoss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=BancosListResponse)
async def query_bancoss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query bancoss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying bancoss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = BancosService(db)
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
        logger.debug(f"Found {result['total']} bancoss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying bancoss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=BancosResponse)
async def get_bancos(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single bancos by ID"""
    logger.debug(f"Fetching bancos with id: {id}, fields={fields}")
    
    service = BancosService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Bancos with id {id} not found")
            raise HTTPException(status_code=404, detail="Bancos not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching bancos {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=BancosResponse, status_code=201)
async def create_bancos(
    data: BancosData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new bancos"""
    logger.debug(f"Creating new bancos with data: {data}")
    
    service = BancosService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create bancos")
        
        logger.info(f"Bancos created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating bancos: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating bancos: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[BancosResponse], status_code=201)
async def create_bancoss_batch(
    request: BancosBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple bancoss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} bancoss")
    
    service = BancosService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} bancoss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[BancosResponse])
async def update_bancoss_batch(
    request: BancosBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple bancoss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} bancoss")
    
    service = BancosService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} bancoss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=BancosResponse)
async def update_bancos(
    id: int,
    data: BancosUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing bancos"""
    logger.debug(f"Updating bancos {id} with data: {data}")

    service = BancosService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Bancos with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Bancos not found")
        
        logger.info(f"Bancos {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating bancos {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating bancos {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_bancoss_batch(
    request: BancosBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple bancoss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} bancoss")
    
    service = BancosService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} bancoss successfully")
        return {"message": f"Successfully deleted {deleted_count} bancoss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_bancos(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single bancos by ID"""
    logger.debug(f"Deleting bancos with id: {id}")
    
    service = BancosService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Bancos with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Bancos not found")
        
        logger.info(f"Bancos {id} deleted successfully")
        return {"message": "Bancos deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting bancos {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")