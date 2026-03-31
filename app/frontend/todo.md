# CentralBankMaximo CRM - Backend Migration Plan

## Overview
Migrate CRM from localStorage to Atoms Cloud backend with Facebook/Google Ads webhook integrations.

## Database Tables (create_only=false for all - admin manages all data)

### 1. leads
- id (integer, auto-increment)
- nome (string), telefone (string), email (string), cpf_cnpj (string, nullable)
- valor_pretendido (float), servico (string), status (string), prioridade (string)
- landing_page_id (string), origem (string), score_estimado (integer)
- relacao_parcela_renda (float), corretor_id (string, nullable)
- historico (string - JSON stringified array)
- created_at (string), updated_at (string)

### 2. landing_pages
- id (integer, auto-increment), ref_id (string - e.g. "lp1")
- nome (string), dominio (string), proprietario (string)
- webhook_url (string), template_mensagem (string)
- ativa (boolean), cor (string), leads_total (integer), conversoes (integer)
- categoria (string, nullable)
- created_at (string)

### 3. corretores
- id (integer, auto-increment), ref_id (string - e.g. "c1")
- nome (string), telefone (string), email (string)
- ativo (boolean), leads_atribuidos (integer)
- landing_pages (string - JSON array), codigo_acesso (string, nullable)
- created_at (string)

### 4. bancos
- id (integer, auto-increment), ref_id (string)
- nome (string), cor (string), ativo (boolean)
- created_at (string)

### 5. produtos
- id (integer, auto-increment), banco_id (string)
- nome (string), categoria (string)
- valor_min (float, nullable), valor_max (float, nullable)
- descricao (string), taxa (float, nullable), prazo (string)
- ativo (boolean), conteudo_links (string - JSON)
- created_at (string), updated_at (string)

### 6. afiliados
- id (integer, auto-increment)
- nome (string), telefone (string), email (string)
- categoria_id (string), ativo (boolean), codigo_acesso (string, nullable)
- created_at (string)

### 7. categorias_afiliados
- id (integer, auto-increment), ref_id (string)
- nome (string), emoji (string)
- created_at (string)

## Backend Webhook Endpoints

### 8. POST /api/v1/webhooks/facebook
- Receives Facebook Lead Ads payload
- Validates and inserts lead into DB

### 9. POST /api/v1/webhooks/google
- Receives Google Ads Lead Form Extensions payload
- Validates and inserts lead into DB

## Frontend Updates

### 10. Create src/lib/api.ts
- Initialize Web SDK client
- Create typed API functions for all entities

### 11. Update components to use API instead of localStorage
- Keep store.ts as fallback/helper but primary data from API
- Update Dashboard, Leads, LandingPages, Corretores, Produtos, Afiliados, Treinamento

## Development Tasks
1. Create all database tables via BackendManager.create_tables
2. Seed tables with mock data via BackendManager.insert_table_data
3. Create webhook Edge Functions via BackendManager.create_function
4. Create frontend api.ts with Web SDK integration
5. Update frontend components to use API
6. Lint, build, test