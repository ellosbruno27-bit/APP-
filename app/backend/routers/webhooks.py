import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.leads import LeadsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


# ---------- Facebook Lead Ads Schemas ----------
class FacebookFieldData(BaseModel):
    name: str
    values: List[str]


class FacebookLeadPayload(BaseModel):
    leadgen_id: Optional[str] = None
    page_id: Optional[str] = None
    form_id: Optional[str] = None
    landing_page_id: Optional[str] = None
    field_data: List[FacebookFieldData] = []


# ---------- Google Ads Lead Form Schemas ----------
class GoogleColumnData(BaseModel):
    column_id: Optional[str] = None
    string_value: Optional[str] = None


class GoogleLeadPayload(BaseModel):
    lead_id: Optional[str] = None
    campaign_id: Optional[str] = None
    form_id: Optional[str] = None
    landing_page_id: Optional[str] = None
    user_column_data: List[GoogleColumnData] = []


# ---------- Response ----------
class WebhookResponse(BaseModel):
    success: bool
    lead_id: Optional[int] = None
    message: str


def _extract_facebook_fields(field_data: List[FacebookFieldData]) -> Dict[str, str]:
    """Extract field values from Facebook Lead Ads field_data array."""
    fields = {}
    field_mapping = {
        "nome": "nome",
        "full_name": "nome",
        "name": "nome",
        "telefone": "telefone",
        "phone_number": "telefone",
        "phone": "telefone",
        "email": "email",
        "cpf_cnpj": "cpf_cnpj",
        "cpf": "cpf_cnpj",
        "cnpj": "cpf_cnpj",
        "valor_pretendido": "valor_pretendido",
        "valor": "valor_pretendido",
        "servico": "servico",
        "service": "servico",
        "produto": "servico",
    }
    for item in field_data:
        key = item.name.lower().strip()
        if key in field_mapping and item.values:
            fields[field_mapping[key]] = item.values[0]
    return fields


def _extract_google_fields(user_column_data: List[GoogleColumnData]) -> Dict[str, str]:
    """Extract field values from Google Ads user_column_data array."""
    fields = {}
    column_mapping = {
        "nome": "nome",
        "full_name": "nome",
        "name": "nome",
        "telefone": "telefone",
        "phone_number": "telefone",
        "phone": "telefone",
        "email": "email",
        "cpf_cnpj": "cpf_cnpj",
        "cpf": "cpf_cnpj",
        "cnpj": "cpf_cnpj",
        "valor_pretendido": "valor_pretendido",
        "valor": "valor_pretendido",
        "servico": "servico",
        "service": "servico",
        "produto": "servico",
    }
    for item in user_column_data:
        if item.column_id and item.string_value:
            key = item.column_id.lower().strip()
            if key in column_mapping:
                fields[column_mapping[key]] = item.string_value
    return fields


def _build_lead_data(fields: Dict[str, str], origem: str, landing_page_id: Optional[str] = None) -> Dict[str, Any]:
    """Build lead data dict from extracted fields."""
    now = datetime.now()

    nome = fields.get("nome", "Lead sem nome")
    telefone = fields.get("telefone", "")
    email = fields.get("email", "")
    cpf_cnpj = fields.get("cpf_cnpj")
    servico = fields.get("servico", "consignado")

    valor_str = fields.get("valor_pretendido", "0")
    try:
        valor_pretendido = float(str(valor_str).replace("R$", "").replace(".", "").replace(",", ".").strip())
    except (ValueError, TypeError):
        valor_pretendido = 0.0

    lp_id = landing_page_id or "lp1"

    origem_label = "Google Ads" if origem == "google_ads" else "Facebook Ads"
    historico = json.dumps(
        [{"data": now.isoformat(), "acao": f"Lead capturado via {origem_label} (webhook)"}],
        ensure_ascii=False,
    )

    return {
        "nome": nome,
        "telefone": telefone,
        "email": email,
        "cpf_cnpj": cpf_cnpj,
        "valor_pretendido": valor_pretendido,
        "servico": servico,
        "status": "novo",
        "prioridade": "medio",
        "landing_page_id": lp_id,
        "origem": origem,
        "score_estimado": 600,
        "relacao_parcela_renda": 0.25,
        "corretor_id": None,
        "historico": historico,
        "created_at": now,
        "updated_at": now,
    }


@router.post("/facebook", response_model=WebhookResponse)
async def webhook_facebook(
    payload: FacebookLeadPayload,
    db: AsyncSession = Depends(get_db),
):
    """Receive leads from Facebook Lead Ads webhook."""
    logger.info(f"Facebook webhook received: leadgen_id={payload.leadgen_id}, form_id={payload.form_id}")

    try:
        fields = _extract_facebook_fields(payload.field_data)

        if not fields.get("nome") and not fields.get("email") and not fields.get("telefone"):
            raise HTTPException(status_code=400, detail="No valid lead data found in payload")

        lead_data = _build_lead_data(
            fields,
            origem="facebook_ads",
            landing_page_id=payload.landing_page_id,
        )

        service = LeadsService(db)
        result = await service.create(lead_data)

        if not result:
            raise HTTPException(status_code=500, detail="Failed to create lead")

        logger.info(f"Facebook lead created: id={result.id}, nome={lead_data['nome']}")
        return WebhookResponse(success=True, lead_id=result.id, message="Lead criado com sucesso via Facebook Ads")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing Facebook webhook: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Webhook processing error: {str(e)}")


@router.post("/google", response_model=WebhookResponse)
async def webhook_google(
    payload: GoogleLeadPayload,
    db: AsyncSession = Depends(get_db),
):
    """Receive leads from Google Ads Lead Form Extensions webhook."""
    logger.info(f"Google webhook received: lead_id={payload.lead_id}, campaign_id={payload.campaign_id}")

    try:
        fields = _extract_google_fields(payload.user_column_data)

        if not fields.get("nome") and not fields.get("email") and not fields.get("telefone"):
            raise HTTPException(status_code=400, detail="No valid lead data found in payload")

        lead_data = _build_lead_data(
            fields,
            origem="google_ads",
            landing_page_id=payload.landing_page_id,
        )

        service = LeadsService(db)
        result = await service.create(lead_data)

        if not result:
            raise HTTPException(status_code=500, detail="Failed to create lead")

        logger.info(f"Google lead created: id={result.id}, nome={lead_data['nome']}")
        return WebhookResponse(success=True, lead_id=result.id, message="Lead criado com sucesso via Google Ads")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing Google webhook: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Webhook processing error: {str(e)}")


# ---------- Verification endpoint for Facebook ----------
@router.get("/facebook")
async def verify_facebook_webhook(request: Request):
    """Facebook webhook verification (GET request for subscription verification)."""
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    # For now, accept any verify_token. In production, validate against a stored token.
    if mode == "subscribe" and challenge:
        logger.info("Facebook webhook verification successful")
        return int(challenge)

    raise HTTPException(status_code=403, detail="Verification failed")