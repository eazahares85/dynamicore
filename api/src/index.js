const app = require('./app');
const config = require('./config');
const db = require('./db');

async function start() {
  try {
    await db.query('SELECT 1');
    console.log('Conexión a PostgreSQL establecida');
  } catch (err) {
    console.error('No se pudo conectar a PostgreSQL:', err.message);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`API escuchando en http://localhost:${config.port}`);
    console.log(`Servicio de pagos: ${config.paymentServiceUrl}`);
  });
}

start();
