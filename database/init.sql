CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS usuarios (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(120) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tarjetas (
    id                  SERIAL PRIMARY KEY,
    usuario_id          INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    ultimos_cuatro      CHAR(4) NOT NULL,
    titular             VARCHAR(120) NOT NULL,
    marca               VARCHAR(50) NOT NULL,
    mes_vencimiento     SMALLINT NOT NULL CHECK (mes_vencimiento BETWEEN 1 AND 12),
    anio_vencimiento    SMALLINT NOT NULL CHECK (anio_vencimiento >= 2020),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE estado_pago AS ENUM ('aprobado', 'rechazado', 'pendiente');

CREATE TABLE IF NOT EXISTS pagos (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    tarjeta_id  INTEGER NOT NULL REFERENCES tarjetas(id) ON DELETE RESTRICT,
    monto       NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
    estado      estado_pago NOT NULL DEFAULT 'pendiente',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tarjetas_usuario ON tarjetas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagos_usuario ON pagos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagos_created ON pagos(created_at DESC);
