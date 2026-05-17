const config = require('../config');
const { createError } = require('../middleware/errorHandler');

async function processPayment(monto) {
  const url = `${config.paymentServiceUrl}/process`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto: Number(monto) }),
    });
  } catch (cause) {
    throw createError(
      503,
      'No se pudo conectar con el servicio de procesamiento de pagos',
      { cause: cause.message }
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw createError(502, 'El servicio de pagos respondió con error', {
      status: response.status,
      body,
    });
  }

  return response.json();
}

module.exports = { processPayment };
