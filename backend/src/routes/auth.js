import { Router } from 'express';
import { requireAuth, signToken } from '../middleware/auth.js';
import { configuredSources, requestExternal } from '../services/externalApi.js';

const router = Router();

function getStaticUsers() {
  return [
    {
      id: 'static-admin',
      usuario: process.env.ADMIN_USER || 'admin',
      contrasena: process.env.ADMIN_PASSWORD || 'admin123',
      nombre: 'Administrador',
      roles: ['admin']
    },
    {
      id: 'static-gestor',
      usuario: process.env.GESTOR_USER || 'gestor',
      contrasena: process.env.GESTOR_PASSWORD || 'admin123',
      nombre: 'Gestor',
      roles: ['gestor']
    }
  ];
}

async function loginExternal(source, usuario, contrasena) {
  const payload = await requestExternal(source, '/auth/login', {
    method: 'POST',
    body: {
      usuario,
      username: usuario,
      contrasena,
      contraseña: contrasena,
      password: contrasena
    }
  });

  return {
    token: payload.token,
    usuario: payload.usuario || payload.user || {}
  };
}

router.post('/login', async (req, res, next) => {
  try {
    const { usuario, username, contrasena, password } = req.body || {};
    const login = usuario || username;
    const pass = contrasena || password;

    if (!login || !pass) {
      return res.status(400).json({ error: 'Usuario y contrasena son requeridos' });
    }

    const attempts = await Promise.allSettled(configuredSources().map(async (source) => ({
      source,
      session: await loginExternal(source, login, pass)
    })));

    const sessions = attempts
      .filter((attempt) => attempt.status === 'fulfilled' && attempt.value.session.token)
      .map((attempt) => attempt.value);

    if (sessions.length === 0) {
      if (String(process.env.ALLOW_STATIC_LOGIN || '').toLowerCase() === 'true') {
        const staticUser = getStaticUsers().find((user) => user.usuario === login && user.contrasena === pass);
        if (staticUser) {
          const user = { id: staticUser.id, usuario: staticUser.usuario, nombre: staticUser.nombre, roles: staticUser.roles };
          return res.json({ token: signToken(user), user });
        }
      }

      return res.status(401).json({ error: 'Credenciales invalidas en las APIs externas' });
    }

    const primary = sessions[0].session.usuario;
    const externalTokens = Object.fromEntries(sessions.map(({ source, session }) => [source, session.token]));
    const user = {
      id: primary.id || primary.id_usuario || login,
      usuario: primary.nombre_usuario || primary.usuario || login,
      nombre: primary.nombre || primary.nombre_usuario || login,
      correo: primary.correo || primary.correo_electronico,
      roles: [primary.rol || 'usuario'].filter(Boolean),
      externalTokens
    };

    res.json({ token: signToken(user), user });
  } catch (error) {
    next(error);
  }
});

router.get('/profile', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
