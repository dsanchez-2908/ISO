import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from './db';
import { Usuario, SessionUser, LoginCredentials } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Encripta una contraseña usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifica una contraseña contra un hash
 * También soporta MD5 para compatibilidad con datos iniciales
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Si es un hash MD5 (32 caracteres hexadecimales), verificar con MD5
  if (hash.length === 32 && /^[a-f0-9]+$/i.test(hash)) {
    const crypto = require('crypto');
    const md5Hash = crypto.createHash('md5').update(password).digest('hex');
    return md5Hash === hash;
  }
  
  // Si no, es bcrypt
  return bcrypt.compare(password, hash);
}

/**
 * Genera un token JWT para un usuario
 */
export function generateToken(user: SessionUser): string {
  return jwt.sign(
    {
      cdUsuario: user.cdUsuario,
      dsUsuario: user.dsUsuario,
      cdTipoUsuario: user.cdTipoUsuario,
      cdEmpresaConsultora: user.cdEmpresaConsultora,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verifica y decodifica un token JWT
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Autentica un usuario y retorna los datos de sesión
 */
export async function authenticate(credentials: LoginCredentials): Promise<SessionUser | null> {
  try {
    const { dsUsuario, dsClave, cdEmpresaConsultora } = credentials;

    // Buscar usuario
    let whereClause = 'u.dsUsuario = @dsUsuario AND u.cdEstado = 1';
    const params: Record<string, any> = { dsUsuario };

    // Si es super admin (cdEmpresaConsultora = 0 o null o undefined)
    if (cdEmpresaConsultora === 0 || cdEmpresaConsultora === null || cdEmpresaConsultora === undefined) {
      whereClause += ' AND u.cdEmpresaConsultora IS NULL';
    } else {
      whereClause += ' AND u.cdEmpresaConsultora = @cdEmpresaConsultora';
      params.cdEmpresaConsultora = cdEmpresaConsultora;
    }

    const usuarios = await query<Usuario & { dsTipoUsuario: string; dsNombreEmpresaConsultora?: string; dsLogo?: string }>(
      `
      SELECT 
        u.*,
        tu.dsTipoUsuario,
        ec.dsNombreEmpresaConsultora,
        ec.dsLogo
      FROM TD_USUARIOS u
      INNER JOIN TV_TIPOS_USUARIO tu ON u.cdTipoUsuario = tu.cdTipoUsuario
      LEFT JOIN TD_EMPRESAS_CONSULTORAS ec ON u.cdEmpresaConsultora = ec.cdEmpresaConsultora
      WHERE ${whereClause}
      `,
      params
    );

    if (usuarios.length === 0) {
      return null;
    }

    const usuario = usuarios[0];

    // Verificar contraseña
    const passwordMatch = await verifyPassword(dsClave, usuario.dsClave);
    if (!passwordMatch) {
      return null;
    }

    // Obtener roles del usuario
    const roles = await query<{ dsRol: string }>(
      `
      SELECT r.dsRol
      FROM TR_USUARIOS_ROLES ur
      INNER JOIN TD_ROLES r ON ur.cdRol = r.cdRol
      WHERE ur.cdUsuario = @cdUsuario AND r.cdEstado = 1
      `,
      { cdUsuario: usuario.cdUsuario }
    );

    // Obtener permisos del usuario (a través de sus roles)
    const permisos = await query<{ dsPermiso: string }>(
      `
      SELECT DISTINCT p.dsPermiso
      FROM TR_USUARIOS_ROLES ur
      INNER JOIN TR_ROLES_PERMISOS rp ON ur.cdRol = rp.cdRol
      INNER JOIN TD_PERMISOS p ON rp.cdPermiso = p.cdPermiso
      WHERE ur.cdUsuario = @cdUsuario
      `,
      { cdUsuario: usuario.cdUsuario }
    );

    // Actualizar último acceso
    await query(
      `
      UPDATE TD_USUARIOS 
      SET feUltimoAcceso = GETDATE()
      WHERE cdUsuario = @cdUsuario
      `,
      { cdUsuario: usuario.cdUsuario }
    );

    // Construir objeto de sesión
    const sessionUser: SessionUser = {
      cdUsuario: usuario.cdUsuario,
      dsUsuario: usuario.dsUsuario,
      dsNombreCompleto: usuario.dsNombreCompleto,
      dsMail: usuario.dsMail,
      cdTipoUsuario: usuario.cdTipoUsuario,
      dsTipoUsuario: usuario.dsTipoUsuario,
      cdEmpresaConsultora: usuario.cdEmpresaConsultora,
      dsNombreEmpresaConsultora: usuario.dsNombreEmpresaConsultora,
      dsLogoEmpresa: usuario.dsLogo,
      cdCliente: usuario.cdCliente,
      cdClienteUsuario: usuario.cdClienteUsuario,
      roles: roles.map(r => r.dsRol),
      permisos: permisos.map(p => p.dsPermiso),
      snPrimerIngreso: usuario.snPrimerIngreso,
      snClaveTemporal: usuario.snClaveTemporal,
    };

    return sessionUser;
  } catch (error) {
    console.error('Error en authenticate:', error);
    return null;
  }
}

/**
 * Obtiene un usuario por su ID con datos de sesión
 */
export async function getUserById(cdUsuario: number): Promise<SessionUser | null> {
  try {
    const usuarios = await query<Usuario & { dsTipoUsuario: string; dsNombreEmpresaConsultora?: string; dsLogo?: string }>(
      `
      SELECT 
        u.*,
        tu.dsTipoUsuario,
        ec.dsNombreEmpresaConsultora,
        ec.dsLogo
      FROM TD_USUARIOS u
      INNER JOIN TV_TIPOS_USUARIO tu ON u.cdTipoUsuario = tu.cdTipoUsuario
      LEFT JOIN TD_EMPRESAS_CONSULTORAS ec ON u.cdEmpresaConsultora = ec.cdEmpresaConsultora
      WHERE u.cdUsuario = @cdUsuario AND u.cdEstado = 1
      `,
      { cdUsuario }
    );

    if (usuarios.length === 0) {
      return null;
    }

    const usuario = usuarios[0];

    // Obtener roles
    const roles = await query<{ dsRol: string }>(
      `
      SELECT r.dsRol
      FROM TR_USUARIOS_ROLES ur
      INNER JOIN TD_ROLES r ON ur.cdRol = r.cdRol
      WHERE ur.cdUsuario = @cdUsuario AND r.cdEstado = 1
      `,
      { cdUsuario }
    );

    // Obtener permisos
    const permisos = await query<{ dsPermiso: string }>(
      `
      SELECT DISTINCT p.dsPermiso
      FROM TR_USUARIOS_ROLES ur
      INNER JOIN TR_ROLES_PERMISOS rp ON ur.cdRol = rp.cdRol
      INNER JOIN TD_PERMISOS p ON rp.cdPermiso = p.cdPermiso
      WHERE ur.cdUsuario = @cdUsuario
      `,
      { cdUsuario }
    );

    const sessionUser: SessionUser = {
      cdUsuario: usuario.cdUsuario,
      dsUsuario: usuario.dsUsuario,
      dsNombreCompleto: usuario.dsNombreCompleto,
      dsMail: usuario.dsMail,
      cdTipoUsuario: usuario.cdTipoUsuario,
      dsTipoUsuario: usuario.dsTipoUsuario,
      cdEmpresaConsultora: usuario.cdEmpresaConsultora,
      dsNombreEmpresaConsultora: usuario.dsNombreEmpresaConsultora,
      dsLogoEmpresa: usuario.dsLogo,
      cdCliente: usuario.cdCliente,
      cdClienteUsuario: usuario.cdClienteUsuario,
      roles: roles.map(r => r.dsRol),
      permisos: permisos.map(p => p.dsPermiso),
      snPrimerIngreso: usuario.snPrimerIngreso,
      snClaveTemporal: usuario.snClaveTemporal,
    };

    return sessionUser;
  } catch (error) {
    console.error('Error en getUserById:', error);
    return null;
  }
}

/**
 * Cambia la contraseña de un usuario
 */
export async function changePassword(cdUsuario: number, newPassword: string): Promise<boolean> {
  try {
    const hashedPassword = await hashPassword(newPassword);
    
    await query(
      `
      UPDATE TD_USUARIOS 
      SET dsClave = @dsClave,
          snClaveTemporal = 0,
          snPrimerIngreso = 0,
          feModificacion = GETDATE(),
          cdUsuarioModificacion = @cdUsuario
      WHERE cdUsuario = @cdUsuario
      `,
      { cdUsuario, dsClave: hashedPassword }
    );

    return true;
  } catch (error) {
    console.error('Error en changePassword:', error);
    return false;
  }
}

/**
 * Verifica si un usuario tiene un permiso específico
 */
export function hasPermission(user: SessionUser, permission: string): boolean {
  // Super admin tiene todos los permisos
  if (user.permisos.includes('SUPERADMIN_ALL')) {
    return true;
  }
  
  return user.permisos.includes(permission);
}

/**
 * Verifica si un usuario tiene alguno de los permisos especificados
 */
export function hasAnyPermission(user: SessionUser, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Verifica si un usuario tiene un rol específico
 */
export function hasRole(user: SessionUser, role: string): boolean {
  return user.roles.includes(role);
}
