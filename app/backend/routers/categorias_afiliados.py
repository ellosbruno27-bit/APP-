import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.categorias_afiliados import Categorias_afiliadosService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/categorias_afiliados", tags=["categorias_afiliados"])


# ---------- Pydantic Schemas ----------
class Categorias_afiliadosData(BaseModel):
    """Entity data schema (for create/update)"""
    ref_id: str
    nome: str
    emoji: str
    created_at: Optional[datetime] = None


class Categorias_afiliadosUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    ref_id: Optional[str] = None
    nome: Optional[str] = None
    emoji: Optional[str] = None
    created_at: Optional[datetime] = None


class Categorias_afiliadosResponse(BaseModel):
    """Entity response schema"""
    id: int
    ref_id: str
    nome: str
    emoji: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Categorias_afiliadosListResponse(BaseModel):
    """List response schema"""
    items: List[Categorias_afiliadosResponse]
    total: int
    skip: int
    limit: int


class Categorias_afiliadosBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Categorias_afiliadosData]


class Categorias_afiliadosBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Categorias_afiliadosUpdateData


class Categorias_afiliadosBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Categorias_afiliadosBatchUpdateItem]


class Categorias_afiliadosBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Categorias_afiliadosListResponse)
async def query_categorias_afiliadoss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query categorias_afiliadoss with filtering, sorting, and pagination"""
    logger.debug(f"Querying categorias_afiliadoss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Categorias_afiliadosService(db)
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
        logger.debug(f"Found {result['total']} categorias_afiliadoss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying categorias_afiliadoss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Categorias_afiliadosListResponse)
async def query_categorias_afiliadoss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query categorias_afiliadoss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying categorias_afiliadoss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Categorias_afiliadosService(db)
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
        logger.debug(f"Found {result['total']} categorias_afiliadoss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying categorias_afiliadoss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Categorias_afiliadosResponse)
async def get_categorias_afiliados(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single categorias_afiliados by ID"""
    logger.debug(f"Fetching categorias_afiliados with id: {id}, fields={fields}")
    
    service = Categorias_afiliadosService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Categorias_afiliados with id {id} not found")
            raise HTTPException(status_code=404, detail="Categorias_afiliados not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching categorias_afiliados {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Categorias_afiliadosResponse, status_code=201)
async def create_categorias_afiliados(
    data: Categorias_afiliadosData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new categorias_afiliados"""
    logger.debug(f"Creating new categorias_afiliados with data: {data}")
    
    service = Categorias_afiliadosService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create categorias_afiliados")
        
        logger.info(f"Categorias_afiliados created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating categorias_afiliados: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating categorias_afiliados: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Categorias_afiliadosResponse], status_code=201)
async def create_categorias_afiliadoss_batch(
    request: Categorias_afiliadosBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple categorias_afiliadoss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} categorias_afiliadoss")
    
    service = Categorias_afiliadosService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} categorias_afiliadoss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Categorias_afiliadosResponse])
async def update_categorias_afiliadoss_batch(
    request: Categorias_afiliadosBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple categorias_afiliadoss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} categorias_afiliadoss")
    
    service = Categorias_afiliadosService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} categorias_afiliadoss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Categorias_afiliadosResponse)
async def update_categorias_afiliados(
    id: int,
    data: Categorias_afiliadosUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing categorias_afiliados"""
    logger.debug(f"Updating categorias_afiliados {id} with data: {data}")

    service = Categorias_afiliadosService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Categorias_afiliados with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Categorias_afiliados not found")
        
        logger.info(f"Categorias_afiliados {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating categorias_afiliados {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating categorias_afiliados {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_categorias_afiliadoss_batch(
    request: Categorias_afiliadosBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple categorias_afiliadoss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} categorias_afiliadoss")
    
    service = Categorias_afiliadosService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} categorias_afiliadoss successfully")
        return {"message": f"Successfully deleted {deleted_count} categorias_afiliadoss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_categorias_afiliados(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single categorias_afiliados by ID"""
    logger.debug(f"Deleting categorias_afiliados with id: {id}")
    
    service = Categorias_afiliadosService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Categorias_afiliados with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Categorias_afiliados not found")
        
        logger.info(f"Categorias_afiliados {id} deleted successfully")
        return {"message": "Categorias_afiliados deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting categorias_afiliados {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")