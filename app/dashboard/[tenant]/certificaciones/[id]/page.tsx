'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
}

export default function CertificacionPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;
  const cdCertificacion = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [certificacion, setCertificacion] = useState<Certificacion | null>(null);
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [expandedRequisito, setExpandedRequisito] = useState<number | null>(null);
  const [templates, setTemplates] = useState<{ [key: number]: Template[] }>({});
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);
  const [registros, setRegistros] = useState<{ [key: number]: Registro[] }>({});

  useEffect(() => {
    loadCertificacion();
    loadRequisitos();
  }, [cdCertificacion]);

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

  const handleToggleRequisito = async (cdRequisito: number) => {
    if (expandedRequisito === cdRequisito) {
      setExpandedRequisito(null);
    } else {
      setExpandedRequisito(cdRequisito);
      if (!templates[cdRequisito]) {
        await loadTemplates(cdRequisito);
      }
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

  const handleAgregarRegistro = async (template: Template, requisito: Requisito) => {
    try {
      const res = await fetch('/api/admin/registros-documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cdCertificacion,
          cdTemplateDocumento: template.cdTemplateDocumento,
          cdRequisito: requisito.cdRequisito,
          dsCodigoDocumento: `${requisito.cdCodigoRequisito}-${Date.now()}`,
          dsNombreDocumento: template.dsNombre
        })
      });

      const data = await res.json();
      if (data.success) {
        // Recargar registros
        await loadRegistros(template.cdTemplateDocumento);
        await loadRequisitos(); // Actualizar contadores
      }
    } catch (error) {
      console.error('Error al agregar registro:', error);
    }
  };

  const handleEditarRegistro = (cdRegistroDocumento: number) => {
    router.push(`/dashboard/${tenant}/certificaciones/${cdCertificacion}/documentos/${cdRegistroDocumento}`);
  };

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <button
            onClick={() => router.back()}
            className="hover:text-gray-900"
          >
            ← Volver
          </button>
        </div>
        
        {certificacion && (
          <>
            <h1 className="text-3xl font-bold mb-2">
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
          </>
        )}
      </div>

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
                      {requisito.nuTotalTemplates} templates | {requisito.nuTotalRegistros} registros
                    </div>
                  </div>
                </div>
                <div className="text-sm">
                  {requisito.nuRegistrosCompletos}/{requisito.nuTotalRegistros} completos
                </div>
              </button>

              {/* Templates */}
              {expandedRequisito === requisito.cdRequisito && (
                <div className="p-4 bg-white">
                  {templates[requisito.cdRequisito] && templates[requisito.cdRequisito].length > 0 ? (
                    <div className="space-y-2">
                      {templates[requisito.cdRequisito].map(template => (
                        <div key={template.cdTemplateDocumento} className="border rounded overflow-hidden">
                          {/* Template Header */}
                          <button
                            onClick={() => handleToggleTemplate(template.cdTemplateDocumento)}
                            className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{expandedTemplate === template.cdTemplateDocumento ? '▼' : '▶'}</span>
                              <div className="text-left">
                                <div className="font-medium">{template.dsNombre}</div>
                                <div className="text-sm text-gray-600">
                                  {template.nuTotalCampos} campos | {template.nuTotalRegistros} registros
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAgregarRegistro(template, requisito);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              + Agregar Registro
                            </button>
                          </button>

                          {/* Registros */}
                          {expandedTemplate === template.cdTemplateDocumento && (
                            <div className="p-4">
                              {registros[template.cdTemplateDocumento] && registros[template.cdTemplateDocumento].length > 0 ? (
                                <div className="space-y-2">
                                  {registros[template.cdTemplateDocumento].map(registro => (
                                    <div
                                      key={registro.cdRegistroDocumento}
                                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                                    >
                                      <div>
                                        <div className="font-medium">{registro.dsNombreDocumento}</div>
                                        <div className="text-sm text-gray-600">
                                          {registro.dsCodigoDocumento} | Estado: {registro.dsEstadoDocumento}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Campos: {registro.nuCamposCompletos}/{registro.nuCamposTotal}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleEditarRegistro(registro.cdRegistroDocumento)}
                                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                                      >
                                        Completar
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                  No hay registros. Click en "+ Agregar Registro" para crear uno.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No hay templates definidos para este requisito
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
