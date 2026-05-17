const express = require('express');
const db = require('../db');
const { createError } = require('../middleware/errorHandler');
const { processPayment } = require('../services/paymentProcessor');

const router = express.Router();

router.post('/', async (req, res, next) => {
  const client = await db.pool.connect();

  try {
    const { usuario_id, tarjeta_id, monto } = req.body;

    const userId = parseInt(usuario_id, 10);
    const cardId = parseInt(tarjeta_id, 10);
    const amount = parseFloat(monto);

    if (Number.isNaN(userId)) {
      throw createError(400, 'usuario_id es obligatorio y debe ser numérico');
    }
    if (Number.isNaN(cardId)) {
      throw createError(400, 'tarjeta_id es obligatorio y debe ser numérico');
    }
    if (Number.isNaN(amount) || amount <= 0) {
      throw createError(400, 'monto es obligatorio y debe ser mayor a cero');
    }

    const cardResult = await client.query(
      `SELECT t.id, t.usuario_id, t.ultimos_cuatro, t.marca
       FROM tarjetas t
       INNER JOIN usuarios u ON u.id = t.usuario_id
       WHERE t.id = $1 AND t.usuario_id = $2`,
      [cardId, userId]
    );

    if (cardResult.rowCount === 0) {
      throw createError(
        404,
        'Tarjeta no encontrada o no pertenece al usuario indicado'
      );
    }

    await client.query('BEGIN');

    const pending = await client.query(
      `INSERT INTO pagos (usuario_id, tarjeta_id, monto, estado)
       VALUES ($1, $2, $3, 'pendiente')
       RETURNING id, usuario_id, tarjeta_id, monto, estado, created_at`,
      [userId, cardId, amount]
    );

    const pago = pending.rows[0];

    const processorResult = await processPayment(amount);
    const estado = processorResult.estado === 'aprobado' ? 'aprobado' : 'rechazado';

    const updated = await client.query(
      `UPDATE pagos SET estado = $1::estado_pago
       WHERE id = $2
       RETURNING id, usuario_id, tarjeta_id, monto, estado, created_at`,
      [estado, pago.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      ...updated.rows[0],
      procesador: {
        aprobado: processorResult.aprobado,
        mensaje: processorResult.mensaje,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

router.get('/usuarios/:usuarioId', async (req, res, next) => {
  try {
    const usuarioId = parseInt(req.params.usuarioId, 10);
    if (Number.isNaN(usuarioId)) {
      throw createError(400, 'ID de usuario inválido');
    }

    const userCheck = await db.query('SELECT id FROM usuarios WHERE id = $1', [
      usuarioId,
    ]);
    if (userCheck.rowCount === 0) {
      throw createError(404, 'Usuario no encontrado');
    }

    const result = await db.query(
      `SELECT p.id, p.usuario_id, p.tarjeta_id, p.monto, p.estado, p.created_at,
              t.ultimos_cuatro, t.marca, t.titular
       FROM pagos p
       INNER JOIN tarjetas t ON t.id = p.tarjeta_id
       WHERE p.usuario_id = $1
       ORDER BY p.created_at DESC`,
      [usuarioId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
