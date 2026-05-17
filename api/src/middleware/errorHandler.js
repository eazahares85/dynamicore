function notFoundHandler(req, res) {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      error: 'Ruta no encontrada',
      path: req.originalUrl,
    });
  }

  res.status(404).render('error', {
    title: 'No encontrado',
    message: 'La página solicitada no existe.',
    status: 404,
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(status).json({
    error: message,
    ...(err.details && { details: err.details }),
  });
}

function createError(status, message, details) {
  const err = new Error(message);
  err.status = status;
  if (details) err.details = details;
  return err;
}

module.exports = { notFoundHandler, errorHandler, createError };
