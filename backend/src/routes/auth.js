import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';

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

async function findDatabaseUser(usuario, contrasena) {
  const result = await query(
    `SELECT u.id_usuario,
            u.usuario,
            u.nombre,
            COALESCE(array_remove(array_agg(r.codigo), NULL), '{}') AS roles
       FROM ong_operativa.usuario u
       LEFT JOIN ong_operativa.usuario_rol ur ON ur.id_usuario = u.id_usuario
       LEFT JOIN ong_operativa.rol r ON r.id_rol = ur.id_rol
      WHERE u.usuario = ?
        AND u.activo = TRUE
        AND u.contrasena_hash = crypt(?, u.contrasena_hash)
      GROUP BY u.id_usuario, u.usuario, u.nombre`,
    [usuario, contrasena]
  );

  const user = result.rows[0];
  if (!user) return null;

  return {
    id: user.id_usuario,
    usuario: user.usuario,
    nombre: user.nombre,
    roles: user.roles
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

    const staticUser = getStaticUsers().find((user) => user.usuario === login && user.contrasena === pass);
    let user = staticUser
      ? { id: staticUser.id, usuario: staticUser.usuario, nombre: staticUser.nombre, roles: staticUser.roles }
      : null;

    if (!user) {
      user = await findDatabaseUser(login, pass);
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    res.json({ token: signToken(user), user });
  } catch (error) {
    next(error);
  }
});

router.get('/profile', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
