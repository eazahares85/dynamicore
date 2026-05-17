const express = require('express');
const db = require('../db');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, nombre, email, created_at FROM usuarios ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { nombre, email } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
      throw createError(400, 'El nombre es obligatorio (mínimo 2 caracteres)');
    }
    if (!email || !validateEmail(email)) {
      throw createError(400, 'El email es obligatorio y debe ser válido');
    }

    const result = await db.query(
      `INSERT INTO usuarios (nombre, email)
       VALUES ($1, $2)
       RETURNING id, nombre, email, created_at`,
      [nombre.trim(), email.trim().toLowerCase()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return next(createError(409, 'Ya existe un usuario con ese email'));
    }
    next(err);
  }
});

router.get('/:usuarioId', async (req, res, next) => {
  try {
    const usuarioId = parseInt(req.params.usuarioId, 10);
    if (Number.isNaN(usuarioId)) {
      throw createError(400, 'ID de usuario inválido');
    }

    const result = await db.query(
      'SELECT id, nombre, email, created_at FROM usuarios WHERE id = $1',
      [usuarioId]
    );

    if (result.rowCount === 0) {
      throw createError(404, 'Usuario no encontrado');
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
