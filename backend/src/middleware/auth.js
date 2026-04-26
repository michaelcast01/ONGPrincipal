import jwt from 'jsonwebtoken';

const fallbackSecret = 'conjunto-ong-dev-secret';

export function signToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      usuario: user.usuario,
      nombre: user.nombre,
      roles: user.roles || [],
      externalTokens: user.externalTokens || {}
    },
    process.env.JWT_SECRET || fallbackSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

export function optionalAuth(req, _res, next) {
  const header = req.get('authorization') || '';
  const [, token] = header.match(/^Bearer\s+(.+)$/i) || [];

  if (!token) return next();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || fallbackSecret);
  } catch (_error) {
    req.user = null;
  }

  return next();
}

export function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const [, token] = header.match(/^Bearer\s+(.+)$/i) || [];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || fallbackSecret);
    return next();
  } catch (_error) {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }
}
