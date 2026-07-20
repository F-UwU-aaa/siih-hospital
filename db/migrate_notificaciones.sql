-- Etapa 9: Migracion notificaciones
-- 1) Relajar CHECK constraint: notificaciones de sistema (STOCK_BAJO, SISTEMA) no tienen destinatario
ALTER TABLE notificacion DROP CONSTRAINT IF EXISTS chk_notificacion_destinatario;

-- 2) Agregar timestamp de creacion
ALTER TABLE notificacion ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP DEFAULT NOW();

-- 3) Backfill creado_en para notificaciones existentes
UPDATE notificacion SET creado_en = COALESCE(fecha_envio, NOW()) WHERE creado_en IS NULL;
