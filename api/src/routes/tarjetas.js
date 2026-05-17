const express = require('express');
const db = require('../db');
const { createError } = require('../middleware/errorHandler');

const router = express.Router({ mergeParams: true });

function extractLastFour(numeroTarjeta) {
  const digits = String(numeroTarjeta).replace(/\D/g, '');
  if (digits.length < 4) return null;
  return digits.slice(-4);
}

function inferBrand(numeroTarjeta) {
  const digits = String(numeroTarjeta).replace(/\D/g, '');
  if (digits.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  return 'otra';
}

router.post('/', async (req, res, next) => {
  try {
    const usuarioId = parseInt(req.params.usuarioId, 10);
    if (Number.isNaN(usuarioId)) {
      throw createError(400, 'ID de usuario inválido');
    }

    const { numero_tarjeta, titular, mes_vencimiento, anio_vencimiento, marca } =
      req.body;

    const ultimosCuatro = extractLastFour(numero_tarjeta);
    if (!ultimosCuatro) {
      throw createError(
        400,
        'numero_tarjeta es obligatorio (datos ficticios, mínimo 4 dígitos)'
      );
    }

    const digits = String(numero_tarjeta).replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) {
      throw createError(400, 'Número de tarjeta ficticio inválido (13-19 dígitos)');
    }

    if (!titular || typeof titular !== 'string' || titular.trim().length < 2) {
      throw createError(400, 'El titular es obligatorio');
    }

    const mes = parseInt(mes_vencimiento, 10);
    const anio = parseInt(anio_vencimiento, 10);
    if (Number.isNaN(mes) || mes < 1 || mes > 12) {
      throw createError(400, 'mes_vencimiento debe estar entre 1 y 12');
    }
    if (Number.isNaN(anio) || anio < 2020) {
      throw createError(400, 'anio_vencimiento inválido');
    }

    const userCheck = await db.query('SELECT id FROM usuarios WHERE id = $1', [
      usuarioId,
    ]);
    if (userCheck.rowCount === 0) {
      throw createError(404, 'Usuario no encontrado');
    }

    const marcaFinal = marca || inferBrand(digits);

    const result = await db.query(
      `INSERT INTO tarjetas (usuario_id, ultimos_cuatro, titular, marca, mes_vencimiento, anio_vencimiento)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, usuario_id, ultimos_cuatro, titular, marca, mes_vencimiento, anio_vencimiento, created_at`,
      [usuarioId, ultimosCuatro, titular.trim(), marcaFinal, mes, anio]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const usuarioId = parseInt(req.params.usuarioId, 10);
    if (Number.isNaN(usuarioId)) {
      throw createError(400, 'ID de usuario inválido');
    }

    const result = await db.query(
      `SELECT id, usuario_id, ultimos_cuatro, titular, marca, mes_vencimiento, anio_vencimiento, created_at
       FROM tarjetas
       WHERE usuario_id = $1
       ORDER BY created_at DESC`,
      [usuarioId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
