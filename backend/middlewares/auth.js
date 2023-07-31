const jwt = require('jsonwebtoken');
const Unauthorized = require('../utils/errors/Unauthorized');

const { NODE_ENV, JWT_SECRET } = process.env;

// eslint-disable-next-line consistent-return
module.exports = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new Unauthorized('Для доступа необходима авторизация'));
  }

  let payload;
  const token = authorization.replace('Bearer ', '');

  try {
    payload = jwt.verify(token, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret');
  } catch (_) {
    return next(new Unauthorized('Для доступа необходима авторизация'));
  }

  req.user = payload;
  next();
};
