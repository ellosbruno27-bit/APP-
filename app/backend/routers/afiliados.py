import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.afiliados import AfiliadosService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/afiliados", tags=["afiliados"])


# ---------- Pydantic Schemas ----------
class AfiliadosData(BaseModel):
    """Entity data schema (for create/update)"""
    nome: str
    telefone: str
    email: str
    categoria_id: str
    ativo: bool
    codigo_acesso: str = None
    created_at: Optional[datetime] = None


class AfiliadosUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    nome: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    categoria_id: Optional[str] = None
    ativo: Optional[bool] = None
    codigo_acesso: Optional[str] = None
    created_at: Optional[datetime] = None


class AfiliadosResponse(BaseModel):
    """Entity response schema"""
    id: int
    nome: str
    telefone: str
    email: str
    categoria_id: str
    ativo: bool
    codigo_acesso: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AfiliadosListResponse(BaseModel):
    """List response schema"""
    items: List[AfiliadosResponse]
    total: int
    skip: int
    limit: int


class AfiliadosBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[AfiliadosData]


class AfiliadosBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: AfiliadosUpdateData


class AfiliadosBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[AfiliadosBatchUpdateItem]


class AfiliadosBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=AfiliadosListResponse)
async def query_afiliadoss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query afiliadoss with filtering, sorting, and pagination"""
    logger.debug(f"Querying afiliadoss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = AfiliadosService(db)
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
        logger.debug(f"Found {result['total']} afiliadoss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying afiliadoss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=AfiliadosListResponse)
async def query_afiliadoss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query afiliadoss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying afiliadoss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = AfiliadosService(db)
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
        logger.debug(f"Found {result['total']} afiliadoss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying afiliadoss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=AfiliadosResponse)
async def get_afiliados(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single afiliados by ID"""
    logger.debug(f"Fetching afiliados with id: {id}, fields={fields}")
    
    service = AfiliadosService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Afiliados with id {id} not found")
            raise HTTPException(status_code=404, detail="Afiliados not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching afiliados {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=AfiliadosResponse, status_code=201)
async def create_afiliados(
    data: AfiliadosData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new afiliados"""
    logger.debug(f"Creating new afiliados with data: {data}")
    
    service = AfiliadosService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create afiliados")
        
        logger.info(f"Afiliados created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating afiliados: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating afiliados: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[AfiliadosResponse], status_code=201)
async def create_afiliadoss_batch(
    request: AfiliadosBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple afiliadoss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} afiliadoss")
    
    service = AfiliadosService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} afiliadoss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[AfiliadosResponse])
async def update_afiliadoss_batch(
    request: AfiliadosBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple afiliadoss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} afiliadoss")
    
    service = AfiliadosService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} afiliadoss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=AfiliadosResponse)
async def update_afiliados(
    id: int,
    data: AfiliadosUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing afiliados"""
    logger.debug(f"Updating afiliados {id} with data: {data}")

    service = AfiliadosService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Afiliados with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Afiliados not found")
        
        logger.info(f"Afiliados {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating afiliados {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating afiliados {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_afiliadoss_batch(
    request: AfiliadosBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple afiliadoss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} afiliadoss")
    
    service = AfiliadosService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} afiliadoss successfully")
        return {"message": f"Successfully deleted {deleted_count} afiliadoss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_afiliados(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single afiliados by ID"""
    logger.debug(f"Deleting afiliados with id: {id}")
    
    service = AfiliadosService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Afiliados with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Afiliados not found")
        
        logger.info(f"Afiliados {id} deleted successfully")
        return {"message": "Afiliados deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting afiliados {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")