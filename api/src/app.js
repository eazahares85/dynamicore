const path = require('path');
const express = require('express');
const usuariosRouter = require('./routes/usuarios');
const tarjetasRouter = require('./routes/tarjetas');
const pagosRouter = require('./routes/pagos');
const webRouter = require('./routes/web');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'dynamicore-api' });
});

app.use('/', webRouter);

app.use('/api/usuarios', usuariosRouter);
app.use('/api/usuarios/:usuarioId/tarjetas', tarjetasRouter);
app.use('/api/pagos', pagosRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
