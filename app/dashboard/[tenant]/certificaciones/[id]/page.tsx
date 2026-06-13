'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Trash2, Eye, Unlink, FileEdit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgregarRegistroDialog } from '@/components/admin/agregar-registro-dialog';
import { AsociarRegistroDialog } from '@/components/admin/asociar-registro-dialog';
import { CopiarRegistroDialog } from '@/components/admin/copiar-registro-dialog';
import { CambiarEstadoRegistroDialog } from '@/components/admin/cambiar-estado-registro-dialog';

interface Certificacion {
  cdCertificacion: number;
  cdCliente: number;
  dsNombreCliente: string;
  cdNorma: number;
  dsNombreNorma: string;
  cdCodigoNorma: number;
  dsCodigo: string;
  cdEstado: number;
  dsEstado: string;
  feInicio: string;
  feFin: string;
  feVencimiento: string;
  feCertificacion: string;
  dsAuditor: string;
  dsObservaciones: string;
}

interface Requisito {
  cdRequisito: number;
  cdCodigoRequisito: string;
  dsRequisito: string;
  dsDescripcion: string;
  nuOrden: number;
  nuTotalTemplates: number;
  nuTemplatesConRegistros: number;
  nuTotalRegistros: number;
  nuRegistrosCompletos: number;
}

interface Template {
  cdTemplateDocumento: number;
  dsNombre: string;
  nuTotalRegistros: number;
  nuRegistrosCompletos: number;
  nuTotalCampos: number;
}

interface Registro {
  cdRegistroDocumento: number;
  dsCodigoDocumento: string;
  dsNombreDocumento: string;
  cdEstadoDocumento: number;
  dsEstadoDocumento: string;
  nuCamposTotal: number;
  nuCamposCompletos: number;
  feCreacion: string;
  feModificacion?: string;
  esAsociado?: boolean; // Para distinguir registros asociados
}

interface RegistroAsociado {
  cdAsociacion: number;
  cdRegistroDocumento: number;
  dsNombreDocumento: string;
  cdEstadoDocumento: number;
  dsEstadoDocumento: string;
  feModificacion: string;
  cdCertificacionOrigen: number;
  dsNombreCertificacionOrigen: string;
  cdRequisitoOrigen: number;
  dsRequisitoOrigen: string;
  cdTemplateDocumento: number;
  dsNombreTemplate: string;
}

export default function CertificacionPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tenant = params.tenant as string;
  const cdCertificacion = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [certificacion, setCertificacion] = useState<Certificacion | null>(null);
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [expandedRequisito, setExpandedRequisito] = useState<number | null>(null);
  const [templates, setTemplates] = useState<{ [key: number]: Template[] }>({});
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);
  const [registros, setRegistros] = useState<{ [key: number]: Registro[] }>({});
  const [registrosPorRequisito, setRegistrosPorRequisito] = useState<{ [key: number]: Registro[] }>({});
  const [registrosAsociados, setRegistrosAsociados] = useState<{ [key: number]: RegistroAsociado[] }>({});
  const [userName, setUserName] = useState('');
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [empresaLogo, setEmpresaLogo] = useState('');
  
  // Dialogs
  const [agregarDialogOpen, setAgregarDialogOpen] = useState(false);
  const [asociarDialogOpen, setAsociarDialogOpen] = useState(false);
  const [copiarDialogOpen, setCopiarDialogOpen] = useState(false);
  const [cambiarEstadoDialogOpen, setCambiarEstadoDialogOpen] = useState(false);
  const [requisitoActual, setRequisitoActual] = useState<Requisito | null>(null);
  const [registroParaCambiarEstado, setRegistroParaCambiarEstado] = useState<{
    cdRegistroDocumento: number;
    cdEstadoActual: number;
    dsNombreDocumento: string;
  } | null>(null);
  
  // Dialog para confirmar eliminación
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    action: () => Promise<void>;
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    checkAuth();
    loadCertificacion();
    loadRequisitos();
  }, [cdCertificacion]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success) {
        const user = data.data.user;
        setUserName(user.dsNombreCompleto || user.dsUsuario);
        setEmpresaNombre(user.dsNombreEmpresaConsultora || '');
        setEmpresaLogo(user.dsLogoEmpresa || '');
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
    }
  };

  const loadCertificacion = async () => {
    try {
      const res = await fetch(`/api/admin/certificaciones/${cdCertificacion}`);
      const data = await res.json();
      if (data.success) {
        setCertificacion(data.data);
      }
    } catch (error) {
      console.error('Error al cargar certificación:', error);
    }
  };

  const loadRequisitos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/certificaciones/${cdCertificacion}/requisitos`);
      const data = await res.json();
      if (data.success) {
        setRequisitos(data.data);
      }
    } catch (error) {
      console.error('Error al cargar requisitos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async (cdRequisito: number) => {
    try {
      const res = await fetch(
        `/api/admin/requisitos/${cdRequisito}/templates?cdCertificacion=${cdCertificacion}`
      );
      const data = await res.json();
      if (data.success) {
        setTemplates(prev => ({ ...prev, [cdRequisito]: data.data }));
      }
    } catch (error) {
      console.error('Error al cargar templates:', error);
    }
  };

  const loadRegistros = async (cdTemplateDocumento: number) => {
    try {
      const res = await fetch(
        `/api/admin/registros-documentos?cdCertificacion=${cdCertificacion}`
      );
      const data = await res.json();
      if (data.success) {
        // Filtrar registros de este template
        const registrosTemplate = data.data.filter(
          (r: any) => r.cdTemplateDocumento === cdTemplateDocumento
        );
        setRegistros(prev => ({ ...prev, [cdTemplateDocumento]: registrosTemplate }));
      }
    } catch (error) {
      console.error('Error al cargar registros:', error);
    }
  };

  const loadRegistrosAsociados = async (cdRequisito: number) => {
    try {
      const res = await fetch(
        `/api/admin/requisitos/${cdRequisito}/registros-asociados?cdCertificacion=${cdCertificacion}`
      );
      const data = await res.json();
      if (data.success) {
        setRegistrosAsociados(prev => ({ ...prev, [cdRequisito]: data.data }));
      }
    } catch (error) {
      console.error('Error al cargar registros asociados:', error);
    }
  };

  const loadRegistrosPorRequisito = async (cdRequisito: number) => {
    try {
      const res = await fetch(
        `/api/admin/registros-documentos?cdCertificacion=${cdCertificacion}&cdRequisito=${cdRequisito}`
      );
      const data = await res.json();
      if (data.success) {
        setRegistrosPorRequisito(prev => ({ ...prev, [cdRequisito]: data.data }));
      }
    } catch (error) {
      console.error('Error al cargar registros del requisito:', error);
    }
  };

  const handleToggleRequisito = async (cdRequisito: number) => {
    if (expandedRequisito === cdRequisito) {
      setExpandedRequisito(null);
    } else {
      setExpandedRequisito(cdRequisito);
      // Cargar registros propios del requisito
      await loadRegistrosPorRequisito(cdRequisito);
      // Cargar registros asociados del requisito
      await loadRegistrosAsociados(cdRequisito);
    }
  };

  const handleToggleTemplate = async (cdTemplateDocumento: number) => {
    if (expandedTemplate === cdTemplateDocumento) {
      setExpandedTemplate(null);
    } else {
      setExpandedTemplate(cdTemplateDocumento);
      if (!registros[cdTemplateDocumento]) {
        await loadRegistros(cdTemplateDocumento);
      }
    }
  };

  const handleAgregarRegistro = (requisito: Requisito) => {
    setRequisitoActual(requisito);
    setAgregarDialogOpen(true);
  };

  const handleAsociarRegistro = (requisito: Requisito) => {
    setRequisitoActual(requisito);
    setAsociarDialogOpen(true);
  };

  const handleCopiarRegistro = (requisito: Requisito) => {
    setRequisitoActual(requisito);
    setCopiarDialogOpen(true);
  };

  const handleDialogSuccess = async () => {
    // Recargar los datos después de crear/asociar/copiar
    await loadRequisitos();
    if (expandedRequisito) {
      // Recargar registros propios del requisito
      await loadRegistrosPorRequisito(expandedRequisito);
      // Recargar registros asociados
      await loadRegistrosAsociados(expandedRequisito);
    }
    
    // Si hay un template expandido, recargar sus registros
    if (expandedTemplate) {
      await loadRegistros(expandedTemplate);
    }
  };

  const handleEliminarRegistro = async (cdRegistroDocumento: number, nombreRegistro: string) => {
    setConfirmAction({
      action: async () => {
        try {
          const res = await fetch(`/api/admin/registros-documentos/${cdRegistroDocumento}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (data.success) {
            toast({
              title: 'Éxito',
              description: 'Registro eliminado correctamente',
            });
            // Recargar registros del requisito
            if (expandedRequisito) {
              await loadRegistrosPorRequisito(expandedRequisito);
            }
            await loadRequisitos();
          } else {
            throw new Error(data.error);
          }
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'No se pudo eliminar el registro',
          });
        }
      },
      title: 'Eliminar registro',
      description: `¿Está seguro que desea eliminar el registro "${nombreRegistro}"? Esta acción no se puede deshacer.`,
    });
    setConfirmDialogOpen(true);
  };

  const handleQuitarAsociacion = async (cdAsociacion: number, nombreRegistro: string) => {
    setConfirmAction({
      action: async () => {
        try {
          const res = await fetch(`/api/admin/asociaciones/${cdAsociacion}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (data.success) {
            toast({
              title: 'Éxito',
              description: 'Asociación eliminada correctamente',
            });
            if (expandedRequisito) {
              await loadRegistrosAsociados(expandedRequisito);
            }
            await loadRequisitos();
          } else {
            throw new Error(data.error);
          }
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'No se pudo eliminar la asociación',
          });
        }
      },
      title: 'Quitar asociación',
      description: `¿Está seguro que desea quitar la asociación del registro "${nombreRegistro}"?`,
    });
    setConfirmDialogOpen(true);
  };

  const handleVerRegistroAsociado = (cdRegistroDocumento: number, cdCertificacionOrigen: number) => {
    router.push(`/dashboard/${tenant}/certificaciones/${cdCertificacionOrigen}/documentos/${cdRegistroDocumento}`);
  };

  const handleCambiarEstado = async (cdRegistroDocumento: number, cdEstadoActual: number, nombreRegistro: string) => {
    setRegistroParaCambiarEstado({
      cdRegistroDocumento,
      cdEstadoActual,
      dsNombreDocumento: nombreRegistro
    });
    setCambiarEstadoDialogOpen(true);
  };

  const handleVistaImpresion = (cdRegistroDocumento: number) => {
    // Abrir el PDF en una nueva pestaña
    window.open(`/api/admin/registros-documentos/${cdRegistroDocumento}/pdf`, '_blank');
  };

  const executeConfirmAction = async () => {
    if (confirmAction) {
      await confirmAction.action();
      setConfirmDialogOpen(false);
      setConfirmAction(null);
    }
  };

  const handleEditarRegistro = (cdRegistroDocumento: number) => {
    router.push(`/dashboard/${tenant}/certificaciones/${cdCertificacion}/documentos/${cdRegistroDocumento}`);
  };

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        empresaNombre={empresaNombre}
        logoBase64={empresaLogo}
        userName={userName}
        tenant={tenant}
      />
      
      <div className="p-6 max-w-7xl mx-auto">
        <Breadcrumb
          items={[
            { label: 'Inicio', href: `/dashboard/${tenant}` },
            { label: 'Gestión de Clientes', href: `/dashboard/${tenant}/clientes` },
            ...(certificacion ? [
              { label: `Detalle del Cliente: ${certificacion.dsNombreCliente}`, href: `/dashboard/${tenant}/clientes/${certificacion.cdCliente}` },
              { label: 'Certificaciones', href: `/dashboard/${tenant}/clientes/${certificacion.cdCliente}#certificaciones` },
              { label: certificacion.dsNombreNorma },
            ] : []),
          ]}
        />
        
        {certificacion && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h1 className="text-3xl font-bold mb-4">
              Certificación: {certificacion.dsNombreNorma}
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Cliente</div>
                <div className="font-medium">{certificacion.dsNombreCliente}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Código</div>
                <div className="font-medium">{certificacion.dsCodigo || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Estado</div>
                <div className="font-medium">{certificacion.dsEstado}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Auditor</div>
                <div className="font-medium">{certificacion.dsAuditor || '-'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Requisitos */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold mb-4">Requisitos de la Norma</h2>
        
        {requisitos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay requisitos definidos para esta norma
          </div>
        ) : (
          requisitos.map(requisito => (
            <div key={requisito.cdRequisito} className="border rounded-lg overflow-hidden">
              {/* Requisito Header */}
              <button
                onClick={() => handleToggleRequisito(requisito.cdRequisito)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{expandedRequisito === requisito.cdRequisito ? '▼' : '▶'}</span>
                  <div className="text-left">
                    <div className="font-semibold">
                      {requisito.cdCodigoRequisito} - {requisito.dsRequisito}
                    </div>
                    <div className="text-sm text-gray-600">
                      {requisito.nuTotalTemplates} formularios | {requisito.nuTotalRegistros} registros
                    </div>
                  </div>
                </div>
                <div className="text-sm">
                  {requisito.nuRegistrosCompletos}/{requisito.nuTotalRegistros} completos
                </div>
              </button>

              {/* Contenido del requisito expandido */}
              {expandedRequisito === requisito.cdRequisito && (
                <div className="p-4 bg-white space-y-4">
                  {/* Botones de acción */}
                  <div className="flex gap-2 mb-4 pb-4 border-b">
                    <Button 
                      onClick={() => handleAgregarRegistro(requisito)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Agregar
                    </Button>
                    <Button 
                      onClick={() => handleAsociarRegistro(requisito)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Asociar
                    </Button>
                    <Button 
                      onClick={() => handleCopiarRegistro(requisito)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Copiar
                    </Button>
                  </div>

                  {/* Formularios nuevos/propios */}
                  {registrosPorRequisito[requisito.cdRequisito] && registrosPorRequisito[requisito.cdRequisito].length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg mb-2">Formularios Propios</h3>
                      <div className="space-y-2">
                        {registrosPorRequisito[requisito.cdRequisito].map(registro => (
                          <div
                            key={registro.cdRegistroDocumento}
                            className="p-3 border rounded hover:bg-gray-50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-base">{registro.dsNombreDocumento}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {registro.dsNombreTemplate || 'Sin formulario'}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  <span className="inline-block mr-3">
                                    <strong>Fecha:</strong> {new Date(registro.feModificacion || registro.feCreacion).toLocaleDateString('es-AR')}
                                  </span>
                                  <span className="inline-block">
                                    <strong>Estado:</strong> <span className={`font-medium ${
                                      registro.dsEstadoDocumento === 'Activo' ? 'text-green-600' :
                                      registro.dsEstadoDocumento === 'Borrador' ? 'text-yellow-600' :
                                      'text-gray-600'
                                    }`}>{registro.dsEstadoDocumento}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleEditarRegistro(registro.cdRegistroDocumento)}
                                className="bg-gray-600 hover:bg-gray-700"
                              >
                                <FileEdit className="h-4 w-4 mr-1" />
                                Completar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleCambiarEstado(registro.cdRegistroDocumento, registro.cdEstadoDocumento, registro.dsNombreDocumento)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Cambiar Estado
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleVistaImpresion(registro.cdRegistroDocumento)}
                                className="bg-red-600 hover:bg-red-700"
                                title="Vista de Impresión (PDF)"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Vista de Impresión
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleEliminarRegistro(registro.cdRegistroDocumento, registro.dsNombreDocumento)}
                                title="Eliminar registro"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Formularios asociados */}
                  {registrosAsociados[requisito.cdRequisito] && registrosAsociados[requisito.cdRequisito].length > 0 && (
                    <div className="space-y-2 mt-6">
                      <h3 className="font-semibold text-lg mb-2">Formularios Asociados</h3>
                      <div className="space-y-2">
                        {registrosAsociados[requisito.cdRequisito].map(asociado => (
                          <div
                            key={asociado.cdAsociacion}
                            className="p-3 border border-purple-200 rounded hover:bg-purple-50 bg-purple-25"
                          >
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">Certificación:</span>
                                  <div className="text-gray-900">{asociado.dsNombreCertificacionOrigen}</div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Requisito:</span>
                                  <div className="text-gray-900">{asociado.dsRequisitoOrigen}</div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Formulario:</span>
                                  <div className="text-gray-900">{asociado.dsNombreTemplate}</div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Título:</span>
                                  <div className="text-gray-900">{asociado.dsNombreDocumento}</div>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleVerRegistroAsociado(asociado.cdRegistroDocumento, asociado.cdCertificacionOrigen)}
                                  className="bg-gray-600 hover:bg-gray-700"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleQuitarAsociacion(asociado.cdAsociacion, asociado.dsNombreDocumento)}
                                >
                                  <Unlink className="h-4 w-4 mr-1" />
                                  Quitar Asociación
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mensaje cuando no hay formularios */}
                  {(!registrosPorRequisito[requisito.cdRequisito] || registrosPorRequisito[requisito.cdRequisito].length === 0) && 
                   (!registrosAsociados[requisito.cdRequisito] || registrosAsociados[requisito.cdRequisito].length === 0) && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No hay formularios asociados a este requisito. Use los botones de arriba para agregar, asociar o copiar formularios.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        </div>
      </div>

      {/* Dialogs */}
      {requisitoActual && (
        <>
          <AgregarRegistroDialog
            open={agregarDialogOpen}
            onOpenChange={setAgregarDialogOpen}
            cdCertificacion={cdCertificacion}
            cdRequisito={requisitoActual.cdRequisito}
            dsRequisito={requisitoActual.dsRequisito}
            onSuccess={handleDialogSuccess}
          />

          <AsociarRegistroDialog
            open={asociarDialogOpen}
            onOpenChange={setAsociarDialogOpen}
            cdCertificacionActual={cdCertificacion}
            cdClienteActual={certificacion?.cdCliente || 0}
            cdRequisito={requisitoActual.cdRequisito}
            dsRequisito={requisitoActual.dsRequisito}
            onSuccess={handleDialogSuccess}
          />

          <CopiarRegistroDialog
            open={copiarDialogOpen}
            onOpenChange={setCopiarDialogOpen}
            cdCertificacionActual={cdCertificacion}
            cdClienteActual={certificacion?.cdCliente || 0}
            cdRequisito={requisitoActual.cdRequisito}
            dsRequisito={requisitoActual.dsRequisito}
            onSuccess={handleDialogSuccess}
          />
        </>
      )}

      {/* Dialog de cambiar estado */}
      {registroParaCambiarEstado && (
        <CambiarEstadoRegistroDialog
          open={cambiarEstadoDialogOpen}
          onOpenChange={setCambiarEstadoDialogOpen}
          cdRegistroDocumento={registroParaCambiarEstado.cdRegistroDocumento}
          cdEstadoActual={registroParaCambiarEstado.cdEstadoActual}
          dsNombreDocumento={registroParaCambiarEstado.dsNombreDocumento}
          onSuccess={handleDialogSuccess}
        />
      )}

      {/* Dialog de confirmación para eliminar */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={executeConfirmAction}
        title={confirmAction?.title || ''}
        description={confirmAction?.description || ''}
        variant="destructive"
      />
    </div>
  );
}
