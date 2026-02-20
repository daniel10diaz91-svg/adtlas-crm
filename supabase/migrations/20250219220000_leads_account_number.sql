-- Campo opcional número de cuenta / referencia para leads (tarjetas pipeline y detalle).
ALTER TABLE leads ADD COLUMN IF NOT EXISTS account_number TEXT;
