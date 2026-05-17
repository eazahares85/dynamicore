const express = require('express');
const path = require('path');
const api = require('../lib/apiClient');

const router = express.Router();

function renderError(res, err, view = 'error') {
  const status = err.status || 500;
  res.status(status).render(view, {
    title: 'Error',
    message: err.message || 'Ocurrió un error inesperado',
    status,
  });
}

router.get('/', async (req, res) => {
  try {
    const usuarios = await api.listUsuarios();
    res.render('home', {
      title: 'Inicio',
      usuarios,
      flash: req.query.flash,
      error: req.query.error,
    });
  } catch (err) {
    renderError(res, err);
  }
});

router.get('/usuarios/nuevo', (req, res) => {
  res.render('usuario-nuevo', {
    title: 'Nuevo usuario',
    values: {},
    error: null,
  });
});

router.post('/usuarios', async (req, res) => {
  const { nombre, email } = req.body;
  try {
    const usuario = await api.createUsuario({ nombre, email });
    res.redirect(`/usuarios/${usuario.id}?flash=usuario_creado`);
  } catch (err) {
    res.status(err.status || 500).render('usuario-nuevo', {
      title: 'Nuevo usuario',
      values: { nombre, email },
      error: err.message,
    });
  }
});

router.get('/usuarios/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [usuario, tarjetas, pagos] = await Promise.all([
      api.getUsuario(id),
      api.listTarjetas(id),
      api.listPagos(id),
    ]);

    res.render('usuario-detalle', {
      title: usuario.nombre,
      usuario,
      tarjetas,
      pagos,
      flash: req.query.flash,
      pagoResult: req.query.pago,
      error: req.query.error || null,
    });
  } catch (err) {
    renderError(res, err);
  }
});

router.post('/usuarios/:id/tarjetas', async (req, res) => {
  const { id } = req.params;
  const { numero_tarjeta, titular, mes_vencimiento, anio_vencimiento, marca } =
    req.body;

  try {
    await api.createTarjeta(id, {
      numero_tarjeta,
      titular,
      mes_vencimiento: parseInt(mes_vencimiento, 10),
      anio_vencimiento: parseInt(anio_vencimiento, 10),
      marca: marca || undefined,
    });
    res.redirect(`/usuarios/${id}?flash=tarjeta_creada`);
  } catch (err) {
    res.redirect(`/usuarios/${id}?error=${encodeURIComponent(err.message)}`);
  }
});

router.post('/usuarios/:id/pagos', async (req, res) => {
  const { id } = req.params;
  const { tarjeta_id, monto } = req.body;

  try {
    const pago = await api.createPago({
      usuario_id: parseInt(id, 10),
      tarjeta_id: parseInt(tarjeta_id, 10),
      monto: parseFloat(monto),
    });
    const estado = pago.estado;
    res.redirect(`/usuarios/${id}?flash=pago_creado&pago=${estado}`);
  } catch (err) {
    res.redirect(`/usuarios/${id}?error=${encodeURIComponent(err.message)}`);
  }
});

module.exports = router;
