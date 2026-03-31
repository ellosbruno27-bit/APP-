import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.corretores import CorretoresService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/corretores", tags=["corretores"])


# ---------- Pydantic Schemas ----------
class CorretoresData(BaseModel):
    """Entity data schema (for create/update)"""
    ref_id: str
    nome: str
    telefone: str
    email: str
    ativo: bool
    leads_atribuidos: int = None
    landing_pages_json: str = None
    codigo_acesso: str = None
    created_at: Optional[datetime] = None


class CorretoresUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    ref_id: Optional[str] = None
    nome: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    ativo: Optional[bool] = None
    leads_atribuidos: Optional[int] = None
    landing_pages_json: Optional[str] = None
    codigo_acesso: Optional[str] = None
    created_at: Optional[datetime] = None


class CorretoresResponse(BaseModel):
    """Entity response schema"""
    id: int
    ref_id: str
    nome: str
    telefone: str
    email: str
    ativo: bool
    leads_atribuidos: Optional[int] = None
    landing_pages_json: Optional[str] = None
    codigo_acesso: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CorretoresListResponse(BaseModel):
    """List response schema"""
    items: List[CorretoresResponse]
    total: int
    skip: int
    limit: int


class CorretoresBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[CorretoresData]


class CorretoresBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: CorretoresUpdateData


class CorretoresBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[CorretoresBatchUpdateItem]


class CorretoresBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=CorretoresListResponse)
async def query_corretoress(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query corretoress with filtering, sorting, and pagination"""
    logger.debug(f"Querying corretoress: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = CorretoresService(db)
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
        logger.debug(f"Found {result['total']} corretoress")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying corretoress: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=CorretoresListResponse)
async def query_corretoress_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query corretoress with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying corretoress: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = CorretoresService(db)
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
        logger.debug(f"Found {result['total']} corretoress")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying corretoress: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=CorretoresResponse)
async def get_corretores(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single corretores by ID"""
    logger.debug(f"Fetching corretores with id: {id}, fields={fields}")
    
    service = CorretoresService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Corretores with id {id} not found")
            raise HTTPException(status_code=404, detail="Corretores not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching corretores {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=CorretoresResponse, status_code=201)
async def create_corretores(
    data: CorretoresData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new corretores"""
    logger.debug(f"Creating new corretores with data: {data}")
    
    service = CorretoresService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create corretores")
        
        logger.info(f"Corretores created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating corretores: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating corretores: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[CorretoresResponse], status_code=201)
async def create_corretoress_batch(
    request: CorretoresBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple corretoress in a single request"""
    logger.debug(f"Batch creating {len(request.items)} corretoress")
    
    service = CorretoresService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} corretoress successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[CorretoresResponse])
async def update_corretoress_batch(
    request: CorretoresBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple corretoress in a single request"""
    logger.debug(f"Batch updating {len(request.items)} corretoress")
    
    service = CorretoresService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} corretoress successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=CorretoresResponse)
async def update_corretores(
    id: int,
    data: CorretoresUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing corretores"""
    logger.debug(f"Updating corretores {id} with data: {data}")

    service = CorretoresService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Corretores with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Corretores not found")
        
        logger.info(f"Corretores {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating corretores {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating corretores {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_corretoress_batch(
    request: CorretoresBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple corretoress by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} corretoress")
    
    service = CorretoresService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} corretoress successfully")
        return {"message": f"Successfully deleted {deleted_count} corretoress", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_corretores(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single corretores by ID"""
    logger.debug(f"Deleting corretores with id: {id}")
    
    service = CorretoresService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Corretores with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Corretores not found")
        
        logger.info(f"Corretores {id} deleted successfully")
        return {"message": "Corretores deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting corretores {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")