// Middleware para proteger rotas que precisam de login
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'You do not have access.' });
};
