'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface FormularioHijoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardar: () => void;
  cdTemplateDocumento: number; // El formulario asociado
  cdRegistroDocumentoPadre: number;
  cdTemplateCampo: number;
  cdCliente: number; // Para cargar listas del cliente
  registroHijo?: any; // Si está editando un registro existente
}

interface CampoFormulario {
  cdTemplateCampo: number;
  snEsTitulo: boolean;
  dsTitulo: string | null;
  dsNombreCampo: string | null;
  dsEtiqueta: string | null;
  cdTipoCampo: number;
  dsTipoCampo: string;
  snObligatorio: boolean;
  snOculto: boolean;
  dsValorDefault: string | null;
  cdLista: number | null;
  dsNombreLista: string | null;
  dsTipoHerencia: string | null;
  dsEntidadCliente: string | null;
  nuOrden: number;
}

interface OpcionLista {
  id: number;
  nombre: string;
}

export function FormularioHijoDialog({
  open,
  onOpenChange,
  onGuardar,
  cdTemplateDocumento,
  cdRegistroDocumentoPadre,
  cdTemplateCampo,
  cdCliente,
  registroHijo
}: FormularioHijoDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [campos, setCampos] = useState<CampoFormulario[]>([]);
  const [valores, setValores] = useState<{ [key: number]: any }>({});
  const [opcionesListas, setOpcionesListas] = useState<{ [key: number]: OpcionLista[] }>({});
  const [listasCliente, setListasCliente] = useState<OpcionLista[]>([]);
  const [listasClienteSeleccionadas, setListasClienteSeleccionadas] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    if (open && cdTemplateDocumento) {
      loadCamposFormulario();
      if (cdCliente) {
        loadListasCliente();
      }
    }
  }, [open, cdTemplateDocumento, cdCliente]);

  const loadCamposFormulario = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/templates-campos?cdTemplateDocumento=${cdTemplateDocumento}`);
      const data = await res.json();
      
      if (data.success) {
        setCampos(data.data);
        
        // Inicializar valores con defaults o valores existentes
        const valoresIniciales: { [key: number]: any } = {};
        const listasSeleccionadas: { [key: number]: number } = {};
        
        data.data.forEach((campo: CampoFormulario) => {
          if (!campo.snEsTitulo) {
            if (registroHijo && registroHijo.valores) {
              valoresIniciales[campo.cdTemplateCampo] = registroHijo.valores[campo.cdTemplateCampo] || '';
              // Si es edición y hay listas seleccionadas, cargarlas
              if (registroHijo.listasClienteSeleccionadas && registroHijo.listasClienteSeleccionadas[campo.cdTemplateCampo]) {
                listasSeleccionadas[campo.cdTemplateCampo] = registroHijo.listasClienteSeleccionadas[campo.cdTemplateCampo];
              }
            } else {
              valoresIniciales[campo.cdTemplateCampo] = campo.dsValorDefault || '';
            }
          }
        });
        setValores(valoresIniciales);
        setListasClienteSeleccionadas(listasSeleccionadas);
        
        // Cargar opciones de listas
        for (const campo of data.data) {
          if (campo.cdTipoCampo === 4) {
            if (campo.dsTipoHerencia === 'NORMA' && campo.cdLista) {
              await loadOpcionesLista(campo.cdLista, campo.cdTemplateCampo);
            } else if (campo.dsTipoHerencia === 'CLIENTE' && campo.dsEntidadCliente === 'LISTAS_CONFIGURADAS') {
              // Si hay una lista seleccionada (modo edición), cargar sus items
              const listaSeleccionada = listasSeleccionadas[campo.cdTemplateCampo];
              if (listaSeleccionada) {
                await loadOpcionesLista(listaSeleccionada, campo.cdTemplateCampo);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar campos del formulario:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los campos del formulario'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadListasCliente = async () => {
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

  const loadOpcionesLista = async (cdLista: number, cdTemplateCampo: number) => {
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
      console.error('Error al cargar opciones de lista:', error);
    }
  };

  const handleSeleccionarListaCliente = async (cdTemplateCampo: number, cdLista: number) => {
    setListasClienteSeleccionadas(prev => ({
      ...prev,
      [cdTemplateCampo]: cdLista
    }));
    // Cargar items de la lista seleccionada
    await loadOpcionesLista(cdLista, cdTemplateCampo);
    // Limpiar el valor seleccionado
    setValores(prev => ({
      ...prev,
      [cdTemplateCampo]: ''
    }));
  };

  const handleGuardar = async () => {
    try {
      // Validar campos obligatorios
      const camposObligatorios = campos.filter(c => !c.snEsTitulo && c.snObligatorio);
      const faltantes = camposObligatorios.filter(c => {
        const valor = valores[c.cdTemplateCampo];
        return valor === undefined || valor === null || valor === '';
      });

      if (faltantes.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Campos obligatorios',
          description: `Complete: ${faltantes.map(c => c.dsEtiqueta).join(', ')}`
        });
        return;
      }

      setSaving(true);
      
      const url = registroHijo 
        ? `/api/admin/formularios-hijos/${registroHijo.cdRegistroDocumentoHijo}`
        : '/api/admin/formularios-hijos';
      
      const method = registroHijo ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cdRegistroDocumentoPadre,
          cdTemplateCampo,
          cdTemplateDocumento,
          valores,
          listasClienteSeleccionadas
        })
      });

      const data = await res.json();
      
      if (data.success) {
        toast({
          title: 'Éxito',
          description: registroHijo ? 'Registro actualizado' : 'Registro creado correctamente'
        });
        onGuardar();
        onOpenChange(false);
        setValores({});
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error al guardar registro hijo:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo guardar el registro'
      });
    } finally {
      setSaving(false);
    }
  };

  const renderCampo = (campo: CampoFormulario) => {
    if (campo.snEsTitulo) {
      return (
        <div key={campo.cdTemplateCampo} className="col-span-2 mt-4 mb-2">
          <h4 className="font-semibold text-gray-800 border-b pb-1">{campo.dsTitulo}</h4>
        </div>
      );
    }

    if (campo.snOculto) return null;

    const valor = valores[campo.cdTemplateCampo] || '';
    const esRequerido = campo.snObligatorio;

    switch (campo.cdTipoCampo) {
      case 1: // Texto
      case 6: // Email
      case 7: // URL
        return (
          <div key={campo.cdTemplateCampo}>
            <Label htmlFor={`campo-${campo.cdTemplateCampo}`}>
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`campo-${campo.cdTemplateCampo}`}
              type={campo.cdTipoCampo === 6 ? 'email' : campo.cdTipoCampo === 7 ? 'url' : 'text'}
              value={valor}
              onChange={(e) => setValores({ ...valores, [campo.cdTemplateCampo]: e.target.value })}
            />
          </div>
        );

      case 2: // Número
      case 5: // Decimal
        return (
          <div key={campo.cdTemplateCampo}>
            <Label htmlFor={`campo-${campo.cdTemplateCampo}`}>
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`campo-${campo.cdTemplateCampo}`}
              type="number"
              step={campo.cdTipoCampo === 5 ? '0.01' : '1'}
              value={valor}
              onChange={(e) => setValores({ ...valores, [campo.cdTemplateCampo]: e.target.value })}
            />
          </div>
        );

      case 3: // Área de texto
        return (
          <div key={campo.cdTemplateCampo} className="col-span-2">
            <Label htmlFor={`campo-${campo.cdTemplateCampo}`}>
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={`campo-${campo.cdTemplateCampo}`}
              value={valor}
              onChange={(e) => setValores({ ...valores, [campo.cdTemplateCampo]: e.target.value })}
              rows={3}
            />
          </div>
        );

      case 4: // Lista
        if (campo.dsTipoHerencia === 'CLIENTE' && campo.dsEntidadCliente === 'LISTAS_CONFIGURADAS') {
          const listaSeleccionada = listasClienteSeleccionadas[campo.cdTemplateCampo];
          return (
            <div key={campo.cdTemplateCampo} className="space-y-2">
              <Label>
                {campo.dsEtiqueta}
                {esRequerido && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <div className="space-y-2">
                <Select
                  value={listaSeleccionada?.toString() || ''}
                  onValueChange={(val) => handleSeleccionarListaCliente(campo.cdTemplateCampo, parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="1. Seleccione lista..." />
                  </SelectTrigger>
                  <SelectContent>
                    {listasCliente.map((lista) => (
                      <SelectItem key={lista.id} value={lista.id.toString()}>
                        {lista.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {listaSeleccionada && (
                  <Select
                    value={valor?.toString()}
                    onValueChange={(val) => setValores({ ...valores, [campo.cdTemplateCampo]: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="2. Seleccione opción..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(opcionesListas[campo.cdTemplateCampo] || []).map((opcion) => (
                        <SelectItem key={opcion.id} value={opcion.id.toString()}>
                          {opcion.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          );
        }
        // Lista normal (herencia NORMA)
        return (
          <div key={campo.cdTemplateCampo}>
            <Label htmlFor={`campo-${campo.cdTemplateCampo}`}>
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={valor?.toString()}
              onValueChange={(val) => setValores({ ...valores, [campo.cdTemplateCampo]: val })}
            >
              <SelectTrigger id={`campo-${campo.cdTemplateCampo}`}>
                <SelectValue placeholder="Seleccione..." />
              </SelectTrigger>
              <SelectContent>
                {(opcionesListas[campo.cdTemplateCampo] || []).map((opcion) => (
                  <SelectItem key={opcion.id} value={opcion.id.toString()}>
                    {opcion.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 8: // Booleano
        return (
          <div key={campo.cdTemplateCampo} className="flex items-center space-x-2 col-span-2">
            <Checkbox
              id={`campo-${campo.cdTemplateCampo}`}
              checked={valor === true || valor === '1'}
              onCheckedChange={(checked) => setValores({ ...valores, [campo.cdTemplateCampo]: checked })}
            />
            <Label htmlFor={`campo-${campo.cdTemplateCampo}`} className="cursor-pointer">
              {campo.dsEtiqueta}
            </Label>
          </div>
        );

      case 9: // Fecha
        return (
          <div key={campo.cdTemplateCampo}>
            <Label htmlFor={`campo-${campo.cdTemplateCampo}`}>
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`campo-${campo.cdTemplateCampo}`}
              type="date"
              value={valor}
              onChange={(e) => setValores({ ...valores, [campo.cdTemplateCampo]: e.target.value })}
            />
          </div>
        );

      case 10: // Fecha y hora
        return (
          <div key={campo.cdTemplateCampo}>
            <Label htmlFor={`campo-${campo.cdTemplateCampo}`}>
              {campo.dsEtiqueta}
              {esRequerido && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`campo-${campo.cdTemplateCampo}`}
              type="datetime-local"
              value={valor}
              onChange={(e) => setValores({ ...valores, [campo.cdTemplateCampo]: e.target.value })}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {registroHijo ? 'Editar' : 'Agregar'} Registro de Formulario
          </DialogTitle>
          <DialogDescription>
            Complete los campos del formulario anidado
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 py-4">
            {campos.map((campo) => renderCampo(campo))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={loading || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
