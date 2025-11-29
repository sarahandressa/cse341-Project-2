function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Ocorreu um erro no servidor', message: err.message });
}

module.exports = errorHandler;
