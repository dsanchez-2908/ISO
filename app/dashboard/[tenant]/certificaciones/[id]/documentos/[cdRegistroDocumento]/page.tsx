'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';

interface Documento {
  cdRegistroDocumento: number;
  cdCertificacion: number;
  cdTemplateDocumento: number;
  dsNombreTemplate: string;
  cdRequisito: number;
  cdCodigoRequisito: string;
  dsRequisito: string;
  dsCodigoDocumento: string;
  dsNombreDocumento: string;
  cdEstadoDocumento: number;
  dsEstadoDocumento: string;
  cdCliente: number;
  dsNombreCliente: string;
  cdNorma: number;
  dsNombreNorma: string;
  dsObservaciones: string;
  feCreacion: string;
  feModificacion: string;
}

interface Campo {
  cdTemplateCampo: number;
  snEsTitulo: boolean;
  dsTitulo: string | null;
  dsNombreCampo: string | null;
  dsEtiqueta: string | null;
  cdTipoCampo: number;
  dsTipoCampo: string;
  snObligatorio: boolean;
  snOculto: boolean;
  snSoloLectura: boolean;
  dsTipoHerencia: string | null;
  dsEntidadCliente: string | null;
  cdLista: number | null;
  dsNombreLista: string | null;
  nuOrden: number;
  cdRegistroCampoValor: number | null;
  dsValor: string | null;
  cdListaItem: number | null;
  dsValorListaItem: string | null;
  cdListaCliente: number | null;
  cdEntidadCliente: number | null;
  dsEntidadTipo: string | null;
}

interface OpcionLista {
  id: number;
  nombre: string;
}

export default function DocumentoFormPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tenant = params.tenant as string;
  const cdCertificacion = parseInt(params.id as string);
  const cdRegistroDocumento = parseInt(params.cdRegistroDocumento as string);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documento, setDocumento] = useState<Documento | null>(null);
  const [campos, setCampos] = useState<Campo[]>([]);
  const [valoresFormulario, setValoresFormulario] = useState<{ [key: number]: any }>({});
  const [opcionesListas, setOpcionesListas] = useState<{ [key: number]: OpcionLista[] }>({});
  const [listasCliente, setListasCliente] = useState<OpcionLista[]>([]);
  const [listasClienteSeleccionadas, setListasClienteSeleccionadas] = useState<{ [key: number]: number }>({});
  const [userName, setUserName] = useState('');
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [empresaLogo, setEmpresaLogo] = useState('');

  useEffect(() => {
    checkAuth();
    loadDocumento();
  }, [cdRegistroDocumento]);

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

  const loadDocumento = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/registros-documentos/${cdRegistroDocumento}`);
      const data = await res.json();
      
      if (data.success) {
        setDocumento(data.data.documento);
        setCampos(data.data.campos);
        
        // Inicializar valores del formulario con los valores existentes
        const valores: { [key: number]: any } = {};
        const listasSeleccionadas: { [key: number]: number } = {};
        data.data.campos.forEach((campo: Campo) => {
          if (!campo.snEsTitulo && campo.cdRegistroCampoValor) {
            if (campo.cdTipoCampo === 4) { // Lista
              if (campo.dsTipoHerencia === 'NORMA') {
                valores[campo.cdTemplateCampo] = campo.cdListaItem || '';
              } else if (campo.dsTipoHerencia === 'CLIENTE') {
                if (campo.dsEntidadCliente === 'LISTAS_CONFIGURADAS') {
                  // Para listas configuradas, guardar la lista seleccionada y el item
                  if (campo.cdListaCliente) {
                    listasSeleccionadas[campo.cdTemplateCampo] = campo.cdListaCliente;
                  }
                  valores[campo.cdTemplateCampo] = campo.cdListaItem || '';
                } else {
                  valores[campo.cdTemplateCampo] = campo.cdEntidadCliente || '';
                }
              }
            } else if (campo.cdTipoCampo === 8) { // Booleano
              valores[campo.cdTemplateCampo] = campo.dsValor === '1' || campo.dsValor === 'true';
            } else {
              valores[campo.cdTemplateCampo] = campo.dsValor || '';
            }
          }
        });
        setValoresFormulario(valores);
        setListasClienteSeleccionadas(listasSeleccionadas);
        setListasClienteSeleccionadas(listasSeleccionadas);

        // Cargar listas del cliente
        if (data.data.documento.cdCliente) {
          await loadListasCliente(data.data.documento.cdCliente);
        }

        // Cargar opciones para campos de tipo Lista
        for (const campo of data.data.campos) {
          if (campo.cdTipoCampo === 4 && !campo.snEsTitulo) { // Lista
            await loadOpcionesLista(campo, data.data.documento);
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar documento:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar el documento',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadListasCliente = async (cdCliente: number) => {
    try {
      const res = await fetch(`/api/admin/listas?cdCliente=${cdCliente}`);
      const data = await res.json();
      if (data.success) {
        setListasCliente(data.data.map((lista: any) => ({
          id: lista.cdLista,
          nombre: lista.dsNombreLista
        })));
      }
    } catch (error) {
      console.error('Error al cargar listas del cliente:', error);
    }
  };

  const loadOpcionesLista = async (campo: Campo, doc?: Documento) => {
    try {
      const documentoActual = doc || documento;
      
      if (campo.dsTipoHerencia === 'NORMA' && campo.cdLista) {
        // Cargar items de lista de norma
        const res = await fetch(`/api/admin/listas-items?cdLista=${campo.cdLista}`);
        const data = await res.json();
        if (data.success) {
          setOpcionesListas(prev => ({
            ...prev,
            [campo.cdTemplateCampo]: data.data.map((item: any) => ({
              id: item.cdListaItem,
              nombre: item.dsValor
            }))
          }));
        }
      } else if (campo.dsTipoHerencia === 'CLIENTE' && campo.dsEntidadCliente && documentoActual) {
        if (campo.dsEntidadCliente === 'LISTAS_CONFIGURADAS') {
          // Para listas configuradas, cargar items de la lista seleccionada (si hay una)
          const listaSeleccionada = listasClienteSeleccionadas[campo.cdTemplateCampo] || campo.cdListaCliente;
          if (listaSeleccionada) {
            const res = await fetch(`/api/admin/listas-items?cdLista=${listaSeleccionada}`);
            const data = await res.json();
            if (data.success) {
              setOpcionesListas(prev => ({
                ...prev,
                [campo.cdTemplateCampo]: data.data.map((item: any) => ({
                  id: item.cdListaItem,
                  nombre: item.dsValor
                }))
              }));
            }
          }
        } else {
          // Cargar entidades del cliente (SECTORES, PUESTOS, EMPLEADOS)
          let endpoint = '';
          let mapFunction = (item: any) => ({ id: 0, nombre: '' });

          switch (campo.dsEntidadCliente) {
            case 'SECTORES':
              endpoint = `/api/admin/sectores?cdCliente=${documentoActual.cdCliente}`;
              mapFunction = (item: any) => ({
                id: item.cdSector,
                nombre: item.dsSector
              });
              break;
            case 'PUESTOS':
              endpoint = `/api/admin/puestos?cdCliente=${documentoActual.cdCliente}`;
              mapFunction = (item: any) => ({
                id: item.cdPuesto,
                nombre: item.dsPuesto
              });
              break;
            case 'EMPLEADOS':
              endpoint = `/api/admin/clientes-usuarios?cdCliente=${documentoActual.cdCliente}`;
              mapFunction = (item: any) => ({
                id: item.cdClienteUsuario,
                nombre: item.dsApellidoNombre
              });
              break;
          }

          if (endpoint) {
            const res = await fetch(endpoint);
            const data = await res.json();
            if (data.success) {
              setOpcionesListas(prev => ({
                ...prev,
                [campo.cdTemplateCampo]: data.data.map(mapFunction)
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar opciones de lista:', error);
    }
  };

  const handleInputChange = (cdTemplateCampo: number, value: any) => {
    setValoresFormulario(prev => ({
      ...prev,
      [cdTemplateCampo]: value
    }));
  };

  const handleListaClienteChange = async (cdTemplateCampo: number, cdLista: number) => {
    // Actualizar la lista seleccionada
    setListasClienteSeleccionadas(prev => ({
      ...prev,
      [cdTemplateCampo]: cdLista
    }));

    // Limpiar el valor del item
    setValoresFormulario(prev => ({
      ...prev,
      [cdTemplateCampo]: ''
    }));

    // Cargar items de la nueva lista
    if (cdLista) {
      try {
        const res = await fetch(`/api/admin/listas-items?cdLista=${cdLista}`);
        const data = await res.json();
        if (data.success) {
          setOpcionesListas(prev => ({
            ...prev,
            [cdTemplateCampo]: data.data.map((item: any) => ({
              id: item.cdListaItem,
              nombre: item.dsValor
            }))
          }));
        }
      } catch (error) {
        console.error('Error al cargar items de lista:', error);
      }
    } else {
      // Limpiar opciones si no hay lista seleccionada
      setOpcionesListas(prev => ({
        ...prev,
        [cdTemplateCampo]: []
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);

      // Validar campos obligatorios
      const camposObligatorios = campos.filter(c => !c.snEsTitulo && c.snObligatorio && !c.snOculto);
      const camposFaltantes = camposObligatorios.filter(c => {
        const valor = valoresFormulario[c.cdTemplateCampo];
        return valor === undefined || valor === null || valor === '';
      });

      if (camposFaltantes.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Campos obligatorios',
          description: `Por favor complete: ${camposFaltantes.map(c => c.dsEtiqueta).join(', ')}`,
        });
        return;
      }

      // Preparar datos para enviar
      const camposActualizados = campos
        .filter(c => !c.snEsTitulo && c.cdRegistroCampoValor)
        .map(campo => {
          const valor = valoresFormulario[campo.cdTemplateCampo];
          let resultado: any = {
            cdRegistroCampoValor: campo.cdRegistroCampoValor,
            dsValor: null,
            cdListaItem: null,
            cdListaCliente: null,
            cdEntidadCliente: null,
            dsEntidadTipo: null
          };

          if (campo.cdTipoCampo === 4) { // Lista
            if (campo.dsTipoHerencia === 'NORMA') {
              resultado.cdListaItem = valor ? parseInt(valor) : null;
            } else if (campo.dsTipoHerencia === 'CLIENTE') {
              if (campo.dsEntidadCliente === 'LISTAS_CONFIGURADAS') {
                // Para listas configuradas, guardar tanto la lista como el item
                resultado.cdListaCliente = listasClienteSeleccionadas[campo.cdTemplateCampo] || null;
                resultado.cdListaItem = valor ? parseInt(valor) : null;
                resultado.dsEntidadTipo = 'LISTAS_CONFIGURADAS';
              } else {
                resultado.cdEntidadCliente = valor ? parseInt(valor) : null;
                resultado.dsEntidadTipo = campo.dsEntidadCliente;
              }
            }
          } else if (campo.cdTipoCampo === 8) { // Booleano
            resultado.dsValor = valor ? '1' : '0';
          } else {
            resultado.dsValor = valor || null;
          }

          return resultado;
        });

      const res = await fetch(`/api/admin/registros-documentos/${cdRegistroDocumento}/campos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campos: camposActualizados })
      });

      const data = await res.json();
      
      if (data.success) {
        toast({
          variant: 'success',
          title: 'Documento guardado',
          description: 'Los campos se han actualizado correctamente',
        });
        router.push(`/dashboard/${tenant}/certificaciones/${cdCertificacion}`);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error al guardar documento:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo guardar el documento',
      });
    } finally {
      setSaving(false);
    }
  };

  const renderCampo = (campo: Campo) => {
    // Títulos se renderizan como headers
    if (campo.snEsTitulo) {
      return (
        <div key={campo.cdTemplateCampo} className="col-span-2 mt-6 mb-2">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            {campo.dsTitulo}
          </h3>
        </div>
      );
    }

    // Campos ocultos no se renderizan
    if (campo.snOculto) {
      return null;
    }

    const valor = valoresFormulario[campo.cdTemplateCampo];
    const esRequerido = campo.snObligatorio;
    const esSoloLectura = campo.snSoloLectura;

    // Renderizar según tipo de campo
    switch (campo.cdTipoCampo) {
      case 1: // Texto
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        );

      case 2: // Numero
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        );

      case 3: // Fecha
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        );

      case 4: // Lista
        const opciones = opcionesListas[campo.cdTemplateCampo] || [];
        
        // Si es una lista configurada del cliente, mostrar dos dropdowns
        if (campo.dsTipoHerencia === 'CLIENTE' && campo.dsEntidadCliente === 'LISTAS_CONFIGURADAS') {
          const listaSeleccionada = listasClienteSeleccionadas[campo.cdTemplateCampo];
          
          return (
            <div key={campo.cdTemplateCampo} className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {campo.dsEtiqueta}
                {esRequerido && <span className="text-red-500 ml-1">*</span>}
                <span className="text-xs text-gray-500 ml-2">(Lista Configurada)</span>
              </label>
              
              {/* Dropdown 1: Seleccionar lista */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Lista:</label>
                <select
                  value={listaSeleccionada || ''}
                  onChange={(e) => handleListaClienteChange(campo.cdTemplateCampo, parseInt(e.target.value))}
                  disabled={esSoloLectura}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">-- Seleccione una lista --</option>
                  {listasCliente.map((lista) => (
                    <option key={lista.id} value={lista.id}>
                      {lista.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Dropdown 2: Seleccionar valor de la lista */}
              {listaSeleccionada && (
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Valor:</label>
                  <select
                    value={valor || ''}
                    onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
                    disabled={esSoloLectura}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">-- Seleccione un valor --</option>
                    {opciones.map((opcion) => (
                      <option key={opcion.id} value={opcion.id}>
                        {opcion.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        }
        
        // Para otros tipos de lista (NORMA o entidades del cliente)
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
              {campo.dsTipoHerencia === 'NORMA' && campo.dsNombreLista && (
                <span className="text-xs text-gray-500 ml-2">({campo.dsNombreLista})</span>
              )}
              {campo.dsTipoHerencia === 'CLIENTE' && campo.dsEntidadCliente && campo.dsEntidadCliente !== 'LISTAS_CONFIGURADAS' && (
                <span className="text-xs text-gray-500 ml-2">({campo.dsEntidadCliente})</span>
              )}
            </label>
            <select
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">-- Seleccione --</option>
              {opciones.map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  {opcion.nombre}
                </option>
              ))}
            </select>
          </div>
        );

      case 5: // TextoLargo
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              rows={4}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        );

      case 6: // Email
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="email"
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        );

      case 7: // Telefono
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="tel"
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        );

      case 8: // Booleano
        return (
          <div key={campo.cdTemplateCampo} className="flex items-center space-x-2 col-span-2">
            <input
              type="checkbox"
              id={`campo-${campo.cdTemplateCampo}`}
              checked={valor || false}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.checked)}
              disabled={esSoloLectura}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`campo-${campo.cdTemplateCampo}`} className="text-sm font-medium text-gray-700">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );

      case 9: // FechaHora
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="datetime-local"
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        );

      case 10: // Decimal
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              step="0.01"
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="0.00"
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!documento) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Documento no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        empresaNombre={empresaNombre}
        logoBase64={empresaLogo}
        userName={userName}
        tenant={tenant}
      />
      
      <div className="p-6 max-w-6xl mx-auto">
        <Breadcrumb
          items={[
            { label: 'Inicio', href: `/dashboard/${tenant}` },
            { label: 'Gestión de Clientes', href: `/dashboard/${tenant}/clientes` },
            ...(documento ? [
              { label: `Detalle del Cliente: ${documento.dsNombreCliente}`, href: `/dashboard/${tenant}/clientes/${documento.cdCliente}` },
              { label: 'Certificaciones', href: `/dashboard/${tenant}/clientes/${documento.cdCliente}#certificaciones` },
              { label: documento.dsNombreNorma, href: `/dashboard/${tenant}/certificaciones/${cdCertificacion}` },
              { label: documento.dsNombreDocumento || 'Documento' },
            ] : []),
          ]}
        />

        {/* Header del documento */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {documento?.dsNombreDocumento || 'Documento sin nombre'}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Código:</span>
              <p className="font-medium">{documento?.dsCodigoDocumento}</p>
            </div>
            <div>
              <span className="text-gray-600">Template:</span>
              <p className="font-medium">{documento?.dsNombreTemplate}</p>
            </div>
            <div>
              <span className="text-gray-600">Requisito:</span>
              <p className="font-medium">{documento?.cdCodigoRequisito} - {documento?.dsRequisito}</p>
            </div>
            <div>
              <span className="text-gray-600">Cliente:</span>
              <p className="font-medium">{documento?.dsNombreCliente}</p>
            </div>
            <div>
              <span className="text-gray-600">Norma:</span>
              <p className="font-medium">{documento?.dsNombreNorma}</p>
            </div>
            <div>
              <span className="text-gray-600">Estado:</span>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                documento?.cdEstadoDocumento === 1 ? 'bg-yellow-100 text-yellow-800' :
                documento?.cdEstadoDocumento === 3 ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {documento?.dsEstadoDocumento}
              </span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campos.map(campo => renderCampo(campo))}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/${tenant}/certificaciones/${cdCertificacion}`)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
