import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.landing_pages import Landing_pagesService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/landing_pages", tags=["landing_pages"])


# ---------- Pydantic Schemas ----------
class Landing_pagesData(BaseModel):
    """Entity data schema (for create/update)"""
    ref_id: str
    nome: str
    dominio: str
    proprietario: str
    webhook_url: str
    template_mensagem: str
    ativa: bool
    cor: str
    leads_total: int = None
    conversoes: int = None
    categoria: str = None
    created_at: Optional[datetime] = None


class Landing_pagesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    ref_id: Optional[str] = None
    nome: Optional[str] = None
    dominio: Optional[str] = None
    proprietario: Optional[str] = None
    webhook_url: Optional[str] = None
    template_mensagem: Optional[str] = None
    ativa: Optional[bool] = None
    cor: Optional[str] = None
    leads_total: Optional[int] = None
    conversoes: Optional[int] = None
    categoria: Optional[str] = None
    created_at: Optional[datetime] = None


class Landing_pagesResponse(BaseModel):
    """Entity response schema"""
    id: int
    ref_id: str
    nome: str
    dominio: str
    proprietario: str
    webhook_url: str
    template_mensagem: str
    ativa: bool
    cor: str
    leads_total: Optional[int] = None
    conversoes: Optional[int] = None
    categoria: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Landing_pagesListResponse(BaseModel):
    """List response schema"""
    items: List[Landing_pagesResponse]
    total: int
    skip: int
    limit: int


class Landing_pagesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Landing_pagesData]


class Landing_pagesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Landing_pagesUpdateData


class Landing_pagesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Landing_pagesBatchUpdateItem]


class Landing_pagesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Landing_pagesListResponse)
async def query_landing_pagess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query landing_pagess with filtering, sorting, and pagination"""
    logger.debug(f"Querying landing_pagess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Landing_pagesService(db)
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
        logger.debug(f"Found {result['total']} landing_pagess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying landing_pagess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Landing_pagesListResponse)
async def query_landing_pagess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query landing_pagess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying landing_pagess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Landing_pagesService(db)
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
        logger.debug(f"Found {result['total']} landing_pagess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying landing_pagess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Landing_pagesResponse)
async def get_landing_pages(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single landing_pages by ID"""
    logger.debug(f"Fetching landing_pages with id: {id}, fields={fields}")
    
    service = Landing_pagesService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Landing_pages with id {id} not found")
            raise HTTPException(status_code=404, detail="Landing_pages not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching landing_pages {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Landing_pagesResponse, status_code=201)
async def create_landing_pages(
    data: Landing_pagesData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new landing_pages"""
    logger.debug(f"Creating new landing_pages with data: {data}")
    
    service = Landing_pagesService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create landing_pages")
        
        logger.info(f"Landing_pages created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating landing_pages: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating landing_pages: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Landing_pagesResponse], status_code=201)
async def create_landing_pagess_batch(
    request: Landing_pagesBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple landing_pagess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} landing_pagess")
    
    service = Landing_pagesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} landing_pagess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Landing_pagesResponse])
async def update_landing_pagess_batch(
    request: Landing_pagesBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple landing_pagess in a single request"""
    logger.debug(f"Batch updating {len(request.items)} landing_pagess")
    
    service = Landing_pagesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} landing_pagess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Landing_pagesResponse)
async def update_landing_pages(
    id: int,
    data: Landing_pagesUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing landing_pages"""
    logger.debug(f"Updating landing_pages {id} with data: {data}")

    service = Landing_pagesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Landing_pages with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Landing_pages not found")
        
        logger.info(f"Landing_pages {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating landing_pages {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating landing_pages {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_landing_pagess_batch(
    request: Landing_pagesBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple landing_pagess by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} landing_pagess")
    
    service = Landing_pagesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} landing_pagess successfully")
        return {"message": f"Successfully deleted {deleted_count} landing_pagess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_landing_pages(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single landing_pages by ID"""
    logger.debug(f"Deleting landing_pages with id: {id}")
    
    service = Landing_pagesService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Landing_pages with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Landing_pages not found")
        
        logger.info(f"Landing_pages {id} deleted successfully")
        return {"message": "Landing_pages deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting landing_pages {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")