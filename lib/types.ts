// ============================================================
// TIPOS DE BASE DE DATOS
// ============================================================

export interface Estado {
  cdEstado: number;
  dsEstado: string;
  dsDescripcion?: string;
  dsGrupo?: string;
  nuOrden: number;
  snActivo: boolean;
}

export interface Pais {
  cdPais: number;
  dsPais: string;
  dsCodigoISO2?: string;
  dsCodigoISO3?: string;
  nuOrden: number;
  snActivo: boolean;
}

export interface Provincia {
  cdProvincia: number;
  cdPais: number;
  dsProvincia: string;
  dsCodigo?: string;
  nuOrden: number;
  snActivo: boolean;
}

export interface TipoUsuario {
  cdTipoUsuario: number;
  dsTipoUsuario: string;
  dsDescripcion?: string;
}

// ============================================================
// EMPRESAS CONSULTORAS
// ============================================================

export interface EmpresaConsultora {
  cdEmpresaConsultora: number;
  dsNombreEmpresaConsultora: string;
  dsCUIT?: string;
  dsDomicilio?: string;
  dsLocalidad?: string;
  dsProvincia?: string;
  dsCodigoPostal?: string;
  dsPais?: string;
  dsTelefono?: string;
  dsMail?: string;
  dsWeb?: string;
  dsLogo?: string; // Base64
  cdEstado: number;
  feCreacion: Date;
  cdUsuarioCreacion?: number;
  feModificacion?: Date;
  cdUsuarioModificacion?: number;
}

export interface Parametro {
  cdParametro: number;
  cdEmpresaConsultora: number;
  dsCodigoParametro: string;
  dsValorParametro?: string;
  dsDescripcion?: string;
  cdEstado: number;
  feCreacion: Date;
}

// ============================================================
// USUARIOS Y SEGURIDAD
// ============================================================

export interface Usuario {
  cdUsuario: number;
  cdEmpresaConsultora?: number;
  dsUsuario: string;
  dsClave: string;
  dsNombreCompleto: string;
  dsMail?: string;
  cdTipoUsuario: number;
  cdCliente?: number;
  cdClienteUsuario?: number;
  snClaveTemporal: boolean;
  snPrimerIngreso: boolean;
  feUltimoAcceso?: Date;
  feAltaUsuario: Date;
  cdEstado: number;
  feCreacion: Date;
  cdUsuarioCreacion?: number;
  feModificacion?: Date;
  cdUsuarioModificacion?: number;
}

export interface Rol {
  cdRol: number;
  cdEmpresaConsultora?: number;
  dsRol: string;
  dsDescripcion?: string;
  snSistema: boolean;
  cdEstado: number;
  feCreacion: Date;
  cdUsuarioCreacion?: number;
  feModificacion?: Date;
  cdUsuarioModificacion?: number;
}

export interface Permiso {
  cdPermiso: number;
  dsPermiso: string;
  dsDescripcion?: string;
  dsModulo?: string;
  dsAccion?: string;
}

// ============================================================
// CLIENTES
// ============================================================

export interface Cliente {
  cdCliente: number;
  cdEmpresaConsultora: number;
  cdCodigoInternoCliente?: string;
  dsRazonSocial: string;
  dsCUIT?: string;
  dsDomicilio?: string;
  dsLocalidad?: string;
  dsCodigoPostal?: string;
  cdProvincia?: number;
  cdPais?: number;
  cdCondicionVenta?: number;
  cdIVA?: number;
  dsConstanciaInscripcion?: string; // ID Aditus
  dsTelefono?: string;
  dsMail?: string;
  dsContacto1?: string;
  dsMail1?: string;
  dsCelular1?: string;
  dsContacto2?: string;
  dsMail2?: string;
  dsCelular2?: string;
  dsWeb?: string;
  dsObservaciones?: string;
  dsLogo?: string; // Base64
  feInicioActividades?: Date;
  dsASCESI?: string;
  dsReferidoPor?: string;
  dsNecesidadEspecifica?: string;
  cdTipoServicio?: number;
  cdModalidadTrabajo?: number;
  cdEstado: number;
  feCreacion: Date;
  cdUsuarioCreacion?: number;
  feModificacion?: Date;
  cdUsuarioModificacion?: number;
}

export interface Sector {
  cdSector: number;
  cdEmpresaConsultora: number;
  cdCliente: number;
  dsSector: string;
  dsDescripcion?: string;
  cdEstado: number;
  feCreacion: Date;
  cdUsuarioCreacion?: number;
}

export interface Puesto {
  cdPuesto: number;
  cdEmpresaConsultora: number;
  cdCliente: number;
  dsPuesto: string;
  dsDescripcion?: string;
  cdEstado: number;
  feCreacion: Date;
  cdUsuarioCreacion?: number;
}

// ============================================================
// NORMAS Y TEMPLATES
// ============================================================

export interface Norma {
  cdNorma: number;
  cdEmpresaConsultora: number;
  cdCodigo: string;
  dsNombre: string;
  dsVersion?: string;
  dsOrganismoEmisor?: string;
  feVigenteDesde?: Date;
  dsDescripcion?: string;
  cdEstado: number;
  feCreacion: Date;
  cdUsuarioCreacion?: number;
  feModificacion?: Date;
  cdUsuarioModificacion?: number;
}

export interface Requisito {
  cdRequisito: number;
  cdNorma: number;
  cdCodigoRequisito?: string;
  dsRequisito: string;
  dsDescripcion?: string;
  nuOrden: number;
  cdEstado: number;
  feCreacion: Date;
  cdUsuarioCreacion?: number;
  feModificacion?: Date;
  cdUsuarioModificacion?: number;
}

export interface TemplateDocumento {
  cdTemplateDocumento: number;
  cdRequisito: number;
  cdCodigo?: string;
  dsNombre: string;
  cdTipoDocumento?: number;
  dsVersionTemplate?: string;
  dsArchivoWord?: string; // Base64
  dsNombreArchivo?: string;
  snActivo: boolean;
  feCreacion: Date;
  cdUsuarioCreacion?: number;
  feModificacion?: Date;
  cdUsuarioModificacion?: number;
}

export interface TemplateSeccion {
  cdTemplateSeccion: number;
  cdTemplateDocumento: number;
  nuOrden: number;
  dsTitulo?: string;
  dsContenidoBase?: string;
  feCreacion: Date;
  cdUsuarioCreacion?: number;
}

export interface TemplateCampo {
  cdTemplateCampo: number;
  cdTemplateDocumento: number;
  dsNombreCampo: string;
  dsEtiqueta?: string;
  cdTipoCampo: number;
  dsValorDefault?: string;
  snHeredaCliente: boolean;
  snObligatorio: boolean;
  cdLista?: number;
  nuOrden: number;
  feCreacion: Date;
  cdUsuarioCreacion?: number;
}

export interface Lista {
  cdLista: number;
  cdEmpresaConsultora: number;
  cdCliente?: number;
  dsNombreLista: string;
  dsDescripcion?: string;
  dsTipo?: string; // 'SISTEMA' | 'CUSTOM'
  cdEstado: number;
  feCreacion: Date;
  cdUsuarioCreacion?: number;
}

export interface ListaItem {
  cdListaItem: number;
  cdLista: number;
  dsValor: string;
  dsDescripcion?: string;
  nuOrden: number;
  snActivo: boolean;
  feCreacion: Date;
  cdUsuarioCreacion?: number;
}

// ============================================================
// CERTIFICACIONES
// ============================================================

export interface Certificacion {
  cdCertificacion: number;
  cdCliente: number;
  cdNorma: number;
  cdCodigo?: string;
  dsDescripcion?: string;
  cdEstado: number; // Borrador/En Proceso/Certificado
  feInicio?: Date;
  feObjetivo?: Date;
  feCertificacion?: Date;
  dsObservaciones?: string;
  feCreacion: Date;
  cdUsuarioCreacion?: number;
  feModificacion?: Date;
  cdUsuarioModificacion?: number;
}

export interface CertificacionDocumento {
  cdCertificacionDocumento: number;
  cdCertificacion: number;
  cdTemplateDocumento: number;
  dsNombreDocumento?: string;
  cdEstado: number; // Pendiente/En Edición/Aprobado
  nuVersionDocumento: number;
  dsDocumentoGenerado?: string; // ID Aditus
  feCreacion: Date;
  cdUsuarioCreacion?: number;
  feModificacion?: Date;
  cdUsuarioModificacion?: number;
}

export interface CertificacionSeccion {
  cdCertificacionSeccion: number;
  cdCertificacionDocumento: number;
  nuOrden?: number;
  dsTitulo?: string;
  dsContenidoEditado?: string;
  feCreacion: Date;
  cdUsuarioCreacion?: number;
  feModificacion?: Date;
  cdUsuarioModificacion?: number;
}

export interface CertificacionCampoValor {
  cdCampoValor: number;
  cdCertificacionDocumento: number;
  dsNombreCampo: string;
  dsValor?: string;
  feCreacion: Date;
  cdUsuarioCreacion?: number;
  feModificacion?: Date;
  cdUsuarioModificacion?: number;
}

// ============================================================
// SESIÓN Y AUTENTICACIÓN
// ============================================================

export interface SessionUser {
  cdUsuario: number;
  dsUsuario: string;
  dsNombreCompleto: string;
  dsMail?: string;
  cdTipoUsuario: number;
  dsTipoUsuario: string;
  cdEmpresaConsultora?: number;
  dsNombreEmpresaConsultora?: string;
  dsLogoEmpresa?: string;
  cdCliente?: number;
  cdClienteUsuario?: number;
  roles: string[];
  permisos: string[];
  snPrimerIngreso: boolean;
  snClaveTemporal: boolean;
}

export interface LoginCredentials {
  dsUsuario: string;
  dsClave: string;
  cdEmpresaConsultora?: number;
}

// ============================================================
// RESPUESTAS API
// ============================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================
// FORMULARIOS
// ============================================================

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'password' | 'textarea' | 'select' | 'file' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: { label: string; value: any }[];
  validation?: any;
}
