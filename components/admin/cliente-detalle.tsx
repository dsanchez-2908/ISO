'use client';

import { useState, useEffect } from 'react';
import { Eye, ExternalLink, Building2, FileText, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ClienteDetalleProps {
  cliente: any;
  cdEmpresaConsultora: number;
  onEdit?: () => void;
}

export function ClienteDetalle({ cliente, cdEmpresaConsultora, onEdit }: ClienteDetalleProps) {
  const { toast } = useToast();
  const [loadingVisor, setLoadingVisor] = useState(false);

  const handleVerDocumento = async (documentId: string) => {
    if (!documentId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No hay documento disponible',
      });
      return;
    }

    setLoadingVisor(true);
    try {
      const response = await fetch('/api/aditus/visor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cdEmpresaConsultora: cdEmpresaConsultora,
          documentId: documentId,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.visorUrl) {
        window.open(data.data.visorUrl, '_blank');
      } else {
        throw new Error(data.error || 'Error al generar URL del visor');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo abrir el visor de documentos',
      });
    } finally {
      setLoadingVisor(false);
    }
  };

  const InfoField = ({ label, value }: { label: string; value: any }) => {
    return (
      <div className="space-y-1">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
        <p className="text-sm text-gray-900 dark:text-gray-100">{value || '-'}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Botón Editar */}
      {onEdit && (
        <div className="flex justify-end">
          <Button onClick={onEdit} size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Editar Cliente
          </Button>
        </div>
      )}

      {/* Información Básica */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Información Básica</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoField label="Código Interno" value={cliente.cdCodigoInternoCliente} />
          <InfoField label="Razón Social" value={cliente.dsRazonSocial} />
          <InfoField label="CUIT" value={cliente.dsCUIT} />
          <InfoField label="Estado" value={cliente.dsEstado} />
          <InfoField label="Fecha Inicio Actividades" value={cliente.feInicioActividades ? new Date(cliente.feInicioActividades).toLocaleDateString() : '-'} />
        </div>
      </div>

      {/* Domicilio y Ubicación */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Domicilio y Ubicación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoField label="Domicilio" value={cliente.dsDomicilio} />
          <InfoField label="Localidad" value={cliente.dsLocalidad} />
          <InfoField label="Código Postal" value={cliente.dsCodigoPostal} />
          <InfoField label="País" value={cliente.dsPais} />
          <InfoField label="Provincia" value={cliente.dsProvincia} />
        </div>
      </div>

      {/* Contacto */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Información de Contacto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoField label="Teléfono" value={cliente.dsTelefono} />
          <InfoField label="Email" value={cliente.dsMail} />
          <InfoField label="Sitio Web" value={cliente.dsWeb} />
        </div>
      </div>

      {/* Contacto Principal */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Contacto Principal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoField label="Nombre Contacto 1" value={cliente.dsContacto1} />
          <InfoField label="Email Contacto 1" value={cliente.dsMail1} />
          <InfoField label="Celular Contacto 1" value={cliente.dsCelular1} />
        </div>
      </div>

      {/* Contacto Secundario */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Contacto Secundario</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoField label="Nombre Contacto 2" value={cliente.dsContacto2} />
          <InfoField label="Email Contacto 2" value={cliente.dsMail2} />
          <InfoField label="Celular Contacto 2" value={cliente.dsCelular2} />
        </div>
      </div>

      {/* Documentos */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Documentos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo del Cliente */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo del Cliente</Label>
            <div className="border dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-center h-40">
              {cliente.dsLogo ? (
                <img 
                  src={`data:image/png;base64,${cliente.dsLogo}`} 
                  alt="Logo del cliente" 
                  className="max-h-32 max-w-full object-contain"
                />
              ) : (
                <div className="text-center text-gray-400 dark:text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Sin logo</p>
                </div>
              )}
            </div>
          </div>

          {/* Constancia de Inscripción */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Constancia de Inscripción</Label>
            <div className="border dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-center h-40">
              {cliente.dsConstanciaInscripcion ? (
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                  <Button 
                    size="sm" 
                    onClick={() => handleVerDocumento(cliente.dsConstanciaInscripcion)}
                    disabled={loadingVisor}
                  >
                    {loadingVisor ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Documento
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-400 dark:text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Sin constancia</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Información Comercial */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Información Comercial</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoField label="Condición de Venta" value={cliente.dsCondicionVenta} />
          <InfoField label="Tipo de IVA" value={cliente.dsTipoIVA} />
          <InfoField label="Tipo de Servicio" value={cliente.dsTipoServicio} />
          <InfoField label="Modalidad de Trabajo" value={cliente.dsModalidadTrabajo} />
        </div>
      </div>

      {/* Información Adicional */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Información Adicional</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoField label="ASCESI" value={cliente.dsASCESI} />
          <InfoField label="Referido Por" value={cliente.dsReferidoPor} />
        </div>
      </div>

      {/* Observaciones */}
      {cliente.dsObservaciones && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Observaciones</h3>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{cliente.dsObservaciones}</p>
          </div>
        </div>
      )}

      {/* Necesidad Específica */}
      {cliente.dsNecesidadEspecifica && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Necesidad Específica</h3>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{cliente.dsNecesidadEspecifica}</p>
          </div>
        </div>
      )}
    </div>
  );
}
