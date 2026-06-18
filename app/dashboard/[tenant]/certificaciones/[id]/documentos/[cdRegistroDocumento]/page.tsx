'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Upload, Link2, Plus, Trash2, Edit } from 'lucide-react';
import { SeleccionarRegistroDialog } from '@/components/admin/seleccionar-registro-dialog';
import { FormularioHijoDialog } from '@/components/admin/formulario-hijo-dialog';

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
  dsAditusDocId: string | null;
  dsNombreArchivo: string | null;
  cdRegistroVinculado: number | null;
  cdFormularioAsociado: number | null;
}

interface OpcionLista {
  id: number;
  nombre: string;
}

export const dynamic = 'force-dynamic';

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
  const [cdEmpresaConsultora, setCdEmpresaConsultora] = useState<number | null>(null);
  
  // Estados para modal de selección de registro (Hipervínculo)
  const [modalRegistroOpen, setModalRegistroOpen] = useState(false);
  const [campoRegistroActual, setCampoRegistroActual] = useState<number | null>(null);

  // Estados para modal de formulario hijo
  const [modalFormularioOpen, setModalFormularioOpen] = useState(false);
  const [campoFormularioActual, setCampoFormularioActual] = useState<{
    cdTemplateCampo: number;
    cdFormularioAsociado: number;
  } | null>(null);
  const [registrosHijos, setRegistrosHijos] = useState<{ [key: number]: any[] }>({});
  const [registroHijoActual, setRegistroHijoActual] = useState<any>(null);

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
        setCdEmpresaConsultora(user.cdEmpresaConsultora || null);
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

        // Cargar registros hijos para campos de tipo Formulario
        for (const campo of data.data.campos) {
          if (campo.cdTipoCampo === 13 && !campo.snEsTitulo && campo.cdFormularioAsociado) {
            await loadRegistrosHijos(campo.cdTemplateCampo);
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
      const res = await fetch(`/api/admin/listas?cdCliente=${cdCliente}&soloActivos=1`);
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
        const res = await fetch(`/api/admin/listas-items?cdLista=${campo.cdLista}&soloActivos=1`);
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
            const res = await fetch(`/api/admin/listas-items?cdLista=${listaSeleccionada}&soloActivos=1`);
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

  const loadRegistrosHijos = async (cdTemplateCampo: number) => {
    try {
      const res = await fetch(
        `/api/admin/formularios-hijos?cdRegistroDocumentoPadre=${cdRegistroDocumento}&cdTemplateCampo=${cdTemplateCampo}`
      );
      const data = await res.json();
      if (data.success) {
        setRegistrosHijos(prev => ({
          ...prev,
          [cdTemplateCampo]: data.data
        }));
      }
    } catch (error) {
      console.error('Error al cargar registros hijos:', error);
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
        const res = await fetch(`/api/admin/listas-items?cdLista=${cdLista}&soloActivos=1`);
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

  const handleCambiarArchivo = async (cdTemplateCampo: number) => {
    // Validar que tengamos el cdEmpresaConsultora
    if (!cdEmpresaConsultora) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo obtener la información de la empresa consultora'
      });
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // Convertir archivo a base64
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Content = event.target?.result as string;
          const base64Data = base64Content.split(',')[1];

          console.log('Subiendo archivo con cdEmpresaConsultora:', cdEmpresaConsultora);

          // Subir a Aditus
          const uploadRes = await fetch('/api/aditus/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cdEmpresaConsultora: cdEmpresaConsultora,
              fileContent: base64Data,
              fileName: file.name,
              contentType: file.type
            })
          });

          const uploadData = await uploadRes.json();
          if (uploadData.success) {
            // Actualizar el valor en el estado
            const campo = campos.find(c => c.cdTemplateCampo === cdTemplateCampo);
            if (campo) {
              campo.dsAditusDocId = uploadData.data.documentId;
              campo.dsNombreArchivo = file.name;
              setCampos([...campos]);
            }
            toast({
              title: 'Éxito',
              description: 'Archivo cargado correctamente'
            });
          } else {
            throw new Error(uploadData.error);
          }
        };
        reader.readAsDataURL(file);
      } catch (error: any) {
        console.error('Error al subir archivo:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'No se pudo subir el archivo'
        });
      }
    };
    input.click();
  };

  const handleVerArchivo = async (docId: string) => {
    if (!cdEmpresaConsultora) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo obtener la información de la empresa consultora'
      });
      return;
    }

    try {
      const res = await fetch('/api/aditus/visor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cdEmpresaConsultora: cdEmpresaConsultora,
          documentId: docId
        })
      });
      const data = await res.json();
      if (data.success && data.data.visorUrl) {
        window.open(data.data.visorUrl, '_blank');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo abrir el archivo'
      });
    }
  };

  const handleCambiarRegistroVinculado = (cdTemplateCampo: number) => {
    setCampoRegistroActual(cdTemplateCampo);
    setModalRegistroOpen(true);
  };

  const handleSeleccionarRegistro = (cdRegistroVinculado: number, nombreRegistro: string) => {
    if (campoRegistroActual) {
      const campo = campos.find(c => c.cdTemplateCampo === campoRegistroActual);
      if (campo) {
        campo.cdRegistroVinculado = cdRegistroVinculado;
        setCampos([...campos]);
        toast({
          title: 'Éxito',
          description: `Registro "${nombreRegistro}" vinculado correctamente`
        });
      }
    }
  };

  const handleVerRegistroVinculado = (cdRegistroVinculado: number) => {
    // Navegar al registro vinculado
    const campo = campos.find(c => c.cdRegistroVinculado === cdRegistroVinculado);
    if (campo && documento) {
      // Obtener el cdCertificacion del registro vinculado para construir la URL correcta
      router.push(`/dashboard/${tenant}/certificaciones/${documento.cdCertificacion}/documentos/${cdRegistroVinculado}`);
    }
  };

  const handleAgregarFormularioHijo = (cdTemplateCampo: number, cdFormularioAsociado: number) => {
    setCampoFormularioActual({ cdTemplateCampo, cdFormularioAsociado });
    setRegistroHijoActual(null); // Nuevo registro
    setModalFormularioOpen(true);
  };

  const handleEditarFormularioHijo = async (cdRegistroDocumentoHijo: number, cdTemplateCampo: number, cdFormularioAsociado: number) => {
    try {
      // Cargar datos del registro hijo
      const res = await fetch(`/api/admin/registros-documentos/${cdRegistroDocumentoHijo}`);
      const data = await res.json();
      
      if (data.success) {
        const doc = data.data.documento;
        const camposData = data.data.campos;
        
        // Preparar valores y listas seleccionadas
        const valores: { [key: number]: any } = {};
        const listasClienteSeleccionadas: { [key: number]: number } = {};
        
        camposData.forEach((campo: Campo) => {
          if (!campo.snEsTitulo) {
            if (campo.cdTipoCampo === 4) { // Lista
              valores[campo.cdTemplateCampo] = campo.cdListaItem || '';
              if (campo.cdListaCliente) {
                listasClienteSeleccionadas[campo.cdTemplateCampo] = campo.cdListaCliente;
              }
            } else if (campo.cdTipoCampo === 8) { // Booleano
              valores[campo.cdTemplateCampo] = campo.dsValor === '1' || campo.dsValor === 'true';
            } else {
              valores[campo.cdTemplateCampo] = campo.dsValor || '';
            }
          }
        });
        
        setCampoFormularioActual({ cdTemplateCampo, cdFormularioAsociado });
        setRegistroHijoActual({
          cdRegistroDocumentoHijo,
          valores,
          listasClienteSeleccionadas
        });
        setModalFormularioOpen(true);
      }
    } catch (error) {
      console.error('Error al cargar registro hijo:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar el registro para editar'
      });
    }
  };

  const handleGuardarFormularioHijo = async () => {
    if (campoFormularioActual) {
      await loadRegistrosHijos(campoFormularioActual.cdTemplateCampo);
      setRegistroHijoActual(null); // Limpiar después de guardar
      toast({
        title: 'Éxito',
        description: 'Registro de formulario guardado correctamente'
      });
    }
  };

  const handleEliminarFormularioHijo = async (cdRegistroDocumentoHijo: number, cdTemplateCampo: number) => {
    if (!confirm('¿Está seguro de eliminar este registro?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/formularios-hijos/${cdRegistroDocumentoHijo}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        await loadRegistrosHijos(cdTemplateCampo);
        toast({
          title: 'Éxito',
          description: 'Registro eliminado correctamente'
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo eliminar el registro'
      });
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
            dsEntidadTipo: null,
            dsAditusDocId: null,
            dsNombreArchivo: null,
            cdRegistroVinculado: null
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
          } else if (campo.cdTipoCampo === 11) { // Archivo
            resultado.dsAditusDocId = campo.dsAditusDocId || null;
            resultado.dsNombreArchivo = campo.dsNombreArchivo || null;
          } else if (campo.cdTipoCampo === 12) { // Hipervínculo
            resultado.cdRegistroVinculado = campo.cdRegistroVinculado || null;
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
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
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>
        );

      case 2: // Numero
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>
        );

      case 3: // Fecha
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {campo.dsEtiqueta}
                {esRequerido && <span className="text-red-500 ml-1">*</span>}
                <span className="text-xs text-gray-500 ml-2">(Lista Configurada)</span>
              </label>
              
              {/* Dropdown 1: Seleccionar lista */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Lista:</label>
                <Combobox
                  options={listasCliente.map(lista => ({
                    value: lista.id.toString(),
                    label: lista.nombre
                  }))}
                  value={listaSeleccionada?.toString() || ''}
                  onChange={(value) => handleListaClienteChange(campo.cdTemplateCampo, parseInt(value))}
                  placeholder="-- Seleccione una lista --"
                  searchPlaceholder="Buscar lista..."
                  disabled={esSoloLectura}
                />
              </div>
              
              {/* Dropdown 2: Seleccionar valor de la lista */}
              {listaSeleccionada && (
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Valor:</label>
                  <Combobox
                    options={opciones.map(opcion => ({
                      value: opcion.id.toString(),
                      label: opcion.nombre
                    }))}
                    value={valor?.toString() || ''}
                    onChange={(value) => handleInputChange(campo.cdTemplateCampo, value)}
                    placeholder="-- Seleccione un valor --"
                    searchPlaceholder="Buscar valor..."
                    disabled={esSoloLectura}
                  />
                </div>
              )}
            </div>
          );
        }
        
        // Para otros tipos de lista (NORMA o entidades del cliente)
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
              {campo.dsTipoHerencia === 'NORMA' && campo.dsNombreLista && (
                <span className="text-xs text-gray-500 ml-2">({campo.dsNombreLista})</span>
              )}
              {campo.dsTipoHerencia === 'CLIENTE' && campo.dsEntidadCliente && campo.dsEntidadCliente !== 'LISTAS_CONFIGURADAS' && (
                <span className="text-xs text-gray-500 ml-2">({campo.dsEntidadCliente})</span>
              )}
            </label>
            <Combobox
              options={opciones.map(opcion => ({
                value: opcion.id.toString(),
                label: opcion.nombre
              }))}
              value={valor?.toString() || ''}
              onChange={(value) => handleInputChange(campo.cdTemplateCampo, value)}
              placeholder="-- Seleccione --"
              searchPlaceholder="Buscar..."
              disabled={esSoloLectura}
            />
          </div>
        );

      case 5: // TextoLargo
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              rows={4}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>
        );

      case 6: // Email
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="email"
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>
        );

      case 7: // Telefono
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="tel"
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
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
            <label htmlFor={`campo-${campo.cdTemplateCampo}`} className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );

      case 9: // FechaHora
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="datetime-local"
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>
        );

      case 10: // Decimal
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              step="0.01"
              value={valor || ''}
              onChange={(e) => handleInputChange(campo.cdTemplateCampo, e.target.value)}
              disabled={esSoloLectura}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
              placeholder="0.00"
            />
          </div>
        );

      case 11: // Archivo
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {campo.dsNombreArchivo && campo.dsAditusDocId ? (
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{campo.dsNombreArchivo}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerArchivo(campo.dsAditusDocId!)}
                    disabled={esSoloLectura}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  {!esSoloLectura && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCambiarArchivo(campo.cdTemplateCampo)}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Cambiar
                    </Button>
                  )}
                </div>
              ) : (
                !esSoloLectura && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCambiarArchivo(campo.cdTemplateCampo)}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Agregar Archivo
                  </Button>
                )
              )}
            </div>
          </div>
        );

      case 12: // Hipervínculo
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {campo.cdRegistroVinculado ? (
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                  <Link2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">\n                    Registro vinculado: #{campo.cdRegistroVinculado}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerRegistroVinculado(campo.cdRegistroVinculado!)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  {!esSoloLectura && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCambiarRegistroVinculado(campo.cdTemplateCampo)}
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                      Cambiar
                    </Button>
                  )}
                </div>
              ) : (
                !esSoloLectura && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCambiarRegistroVinculado(campo.cdTemplateCampo)}
                    className="w-full"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Asociar Registro
                  </Button>
                )
              )}
            </div>
          </div>
        );

      case 13: // Formulario
        const hijosDelCampo = registrosHijos[campo.cdTemplateCampo] || [];
        return (
          <div key={campo.cdTemplateCampo} className="flex flex-col col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {!esSoloLectura && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAgregarFormularioHijo(campo.cdTemplateCampo, campo.cdFormularioAsociado!)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Registro
                </Button>
              )}
              
              {/* Lista de registros hijos */}
              {hijosDelCampo.length > 0 && (
                <div className="border border-gray-200 rounded-md divide-y">
                  {hijosDelCampo.map((hijo) => (
                    <div key={hijo.cdRegistroDocumentoHijo} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {hijo.dsCodigoDocumento} - {hijo.dsNombreDocumento}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {!esSoloLectura && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditarFormularioHijo(hijo.cdRegistroDocumentoHijo, campo.cdTemplateCampo, campo.cdFormularioAsociado!)}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminarFormularioHijo(hijo.cdRegistroDocumentoHijo, campo.cdTemplateCampo)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {documento?.dsNombreDocumento || 'Documento sin nombre'}
            </h1>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              ← Volver
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Código:</span>
              <p className="font-medium dark:text-gray-200">{documento?.dsCodigoDocumento}</p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Template:</span>
              <p className="font-medium dark:text-gray-200">{documento?.dsNombreTemplate}</p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Requisito:</span>
              <p className="font-medium dark:text-gray-200">{documento?.cdCodigoRequisito} - {documento?.dsRequisito}</p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Cliente:</span>
              <p className="font-medium dark:text-gray-200">{documento?.dsNombreCliente}</p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Norma:</span>
              <p className="font-medium dark:text-gray-200">{documento?.dsNombreNorma}</p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Estado:</span>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                documento?.cdEstadoDocumento === 1 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                documento?.cdEstadoDocumento === 3 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}>
                {documento?.dsEstadoDocumento}
              </span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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

      {/* Modal de selección de registro para Hipervínculo */}
      {documento && cdEmpresaConsultora && (
        <SeleccionarRegistroDialog
          open={modalRegistroOpen}
          onOpenChange={setModalRegistroOpen}
          onSeleccionar={handleSeleccionarRegistro}
          cdCliente={documento.cdCliente}
          cdEmpresaConsultora={cdEmpresaConsultora}
        />
      )}

      {/* Modal de formulario hijo para Formulario */}
      {campoFormularioActual && documento && (
        <FormularioHijoDialog
          open={modalFormularioOpen}
          onOpenChange={setModalFormularioOpen}
          onGuardar={handleGuardarFormularioHijo}
          cdTemplateDocumento={campoFormularioActual.cdFormularioAsociado}
          cdRegistroDocumentoPadre={cdRegistroDocumento}
          cdTemplateCampo={campoFormularioActual.cdTemplateCampo}
          cdCliente={documento.cdCliente}
          registroHijo={registroHijoActual}
        />
      )}
    </div>
  );
}
