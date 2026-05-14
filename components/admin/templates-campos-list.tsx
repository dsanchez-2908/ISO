'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Check, X, Heading } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface TemplateCampo {
  cdTemplateCampo: number;
  cdTemplateDocumento: number;
  snEsTitulo: boolean;
  dsTitulo: string | null;
  dsNombreCampo: string;
  dsEtiqueta: string | null;
  cdTipoCampo: number;
  dsTipoCampo: string;
  dsValorDefault: string | null;
  snObligatorio: boolean;
  snOculto: boolean;
  snSoloLectura: boolean;
  dsTipoHerencia: string | null;
  dsEntidadCliente: string | null;
  cdLista: number | null;
  dsNombreLista: string | null;
  cdValorDefaultLista: number | null;
  nuOrden: number;
}

interface TipoCampo {
  cdTipoCampo: number;
  dsTipoCampo: string;
  dsDescripcion: string;
}

interface Lista {
  cdLista: number;
  dsNombreLista: string;
}

interface ListaItem {
  cdListaItem: number;
  dsValor: string;
}

interface TemplatesCamposListProps {
  cdTemplateDocumento: number;
  dsNombreTemplate: string;
  cdNorma: number;
}

export function TemplatesCamposList({ cdTemplateDocumento, dsNombreTemplate, cdNorma }: TemplatesCamposListProps) {
  const { toast } = useToast();
  const [campos, setCampos] = useState<TemplateCampo[]>([]);
  const [tiposCampo, setTiposCampo] = useState<TipoCampo[]>([]);
  const [listas, setListas] = useState<Lista[]>([]);
  const [listasItems, setListasItems] = useState<{ [key: number]: ListaItem[] }>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampo, setEditingCampo] = useState<TemplateCampo | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    action: () => Promise<void>;
    title: string;
    description: string;
  } | null>(null);
  
  // Tipo de campo: "titulo" o "campo"
  const [tipoCampoElemento, setTipoCampoElemento] = useState<'titulo' | 'campo'>('campo');
  
  const [formData, setFormData] = useState({
    dsTitulo: '',
    dsNombreCampo: '',
    dsEtiqueta: '',
    cdTipoCampo: '',
    dsValorDefault: '',
    snObligatorio: false,
    snOculto: false,
    snSoloLectura: false,
    dsTipoHerencia: '', // 'NORMA' o 'CLIENTE'
    dsEntidadCliente: '', // 'SECTORES', 'PUESTOS', 'EMPLEADOS'
    cdLista: '',
    cdValorDefaultLista: '',
    tieneValorDefault: false,
    nuOrden: '',
  });

  useEffect(() => {
    loadTiposCampo();
    loadCampos();
    loadListas();
  }, [cdTemplateDocumento]);

  const loadTiposCampo = async () => {
    try {
      const response = await fetch('/api/admin/tipos-campo');
      const data = await response.json();
      if (data.success) {
        setTiposCampo(data.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar tipos de campo',
        variant: 'destructive',
      });
    }
  };

  const loadCampos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/templates-campos?cdTemplateDocumento=${cdTemplateDocumento}`);
      const data = await response.json();
      if (data.success) {
        setCampos(data.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar campos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadListas = async () => {
    try {
      const response = await fetch(`/api/admin/listas?cdNorma=${cdNorma}`);
      const data = await response.json();
      if (data.success) {
        setListas(data.data);
      }
    } catch (error) {
      console.error('Error al cargar listas:', error);
    }
  };

  const loadListaItems = async (cdLista: number) => {
    if (listasItems[cdLista]) return; // Ya está cargado
    
    try {
      const response = await fetch(`/api/admin/listas-items?cdLista=${cdLista}`);
      const data = await response.json();
      if (data.success) {
        setListasItems(prev => ({ ...prev, [cdLista]: data.data }));
      }
    } catch (error) {
      console.error('Error al cargar items de lista:', error);
    }
  };

  const handleOpenDialog = (campo?: TemplateCampo) => {
    if (campo) {
      setEditingCampo(campo);
      setTipoCampoElemento(campo.snEsTitulo ? 'titulo' : 'campo');
      
      setFormData({
        dsTitulo: campo.dsTitulo || '',
        dsNombreCampo: campo.dsNombreCampo || '',
        dsEtiqueta: campo.dsEtiqueta || '',
        cdTipoCampo: campo.cdTipoCampo?.toString() || '',
        dsValorDefault: campo.dsValorDefault || '',
        snObligatorio: campo.snObligatorio || false,
        snOculto: campo.snOculto || false,
        snSoloLectura: campo.snSoloLectura || false,
        dsTipoHerencia: campo.dsTipoHerencia || '',
        dsEntidadCliente: campo.dsEntidadCliente || '',
        cdLista: campo.cdLista?.toString() || '',
        cdValorDefaultLista: campo.cdValorDefaultLista?.toString() || '',
        tieneValorDefault: !!campo.cdValorDefaultLista,
        nuOrden: campo.nuOrden?.toString() || '',
      });
      
      // Cargar items si tiene lista seleccionada
      if (campo.cdLista) {
        loadListaItems(campo.cdLista);
      }
    } else {
      setEditingCampo(null);
      setTipoCampoElemento('campo');
      setFormData({
        dsTitulo: '',
        dsNombreCampo: '',
        dsEtiqueta: '',
        cdTipoCampo: '1',
        dsValorDefault: '',
        snObligatorio: false,
        snOculto: false,
        snSoloLectura: false,
        dsTipoHerencia: '',
        dsEntidadCliente: '',
        cdLista: '',
        cdValorDefaultLista: '',
        tieneValorDefault: false,
        nuOrden: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación: Si es Lista con herencia CLIENTE, debe tener entidad seleccionada
    if (tipoCampoElemento === 'campo' && 
        parseInt(formData.cdTipoCampo) === 4 && 
        formData.dsTipoHerencia === 'CLIENTE' && 
        !formData.dsEntidadCliente) {
      toast({
        title: 'Validación',
        description: 'Debe seleccionar una entidad de cliente cuando la lista hereda de cliente',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = editingCampo
        ? `/api/admin/templates-campos/${editingCampo.cdTemplateCampo}`
        : '/api/admin/templates-campos';

      const method = editingCampo ? 'PUT' : 'POST';

      const payload = {
        cdTemplateDocumento,
        snEsTitulo: tipoCampoElemento === 'titulo',
        dsTitulo: tipoCampoElemento === 'titulo' ? formData.dsTitulo : null,
        dsNombreCampo: tipoCampoElemento === 'campo' ? formData.dsNombreCampo : null,
        dsEtiqueta: tipoCampoElemento === 'campo' ? formData.dsEtiqueta : null,
        cdTipoCampo: tipoCampoElemento === 'campo' ? parseInt(formData.cdTipoCampo) : null,
        dsValorDefault: formData.dsValorDefault || null,
        snObligatorio: formData.snObligatorio,
        snOculto: formData.snOculto,
        snSoloLectura: formData.snSoloLectura,
        dsTipoHerencia: formData.dsTipoHerencia || null,
        dsEntidadCliente: formData.dsEntidadCliente || null,
        cdLista: formData.cdLista ? parseInt(formData.cdLista) : null,
        cdValorDefaultLista: formData.tieneValorDefault && formData.cdValorDefaultLista 
          ? parseInt(formData.cdValorDefaultLista) 
          : null,
        nuOrden: formData.nuOrden ? parseInt(formData.nuOrden) : 0,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: `${tipoCampoElemento === 'titulo' ? 'Título' : 'Campo'} ${editingCampo ? 'actualizado' : 'creado'} correctamente`,
          variant: 'success',
        });
        setDialogOpen(false);
        loadCampos();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al guardar',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (cdTemplateCampo: number) => {
    setConfirmAction({
      action: async () => {
        try {
          const response = await fetch(`/api/admin/templates-campos/${cdTemplateCampo}`, {
            method: 'DELETE',
          });

          const data = await response.json();

          if (data.success) {
            toast({
              title: 'Éxito',
              description: 'Elemento eliminado correctamente',
              variant: 'success',
            });
            loadCampos();
          } else {
            toast({
              title: 'Error',
              description: data.error || 'Error al eliminar',
              variant: 'destructive',
            });
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Error al eliminar',
            variant: 'destructive',
          });
        }
      },
      title: 'Eliminar Campo',
      description: '¿Está seguro de eliminar este elemento?',
    });
    setConfirmDialogOpen(true);
  };

  // Cuando cambia el tipo de campo a Lista
  const handleTipoCampoChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      cdTipoCampo: value,
      // Resetear campos de lista si cambia a otro tipo
      dsTipoHerencia: value === '4' ? prev.dsTipoHerencia : '',
      dsEntidadCliente: '',
      cdLista: '',
      cdValorDefaultLista: '',
      tieneValorDefault: false,
    }));
  };

  // Cuando cambia la lista seleccionada
  const handleListaChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      cdLista: value,
      cdValorDefaultLista: '',
      tieneValorDefault: false,
    }));
    loadListaItems(parseInt(value));
  };

  if (loading) {
    return <div className="text-center py-4">Cargando campos...</div>;
  }

  const esLista = formData.cdTipoCampo === '4';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Campos del Template</h3>
          <p className="text-sm text-gray-500">{dsNombreTemplate}</p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Elemento
        </Button>
      </div>

      {campos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay campos definidos para este template
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Nombre/Título</TableHead>
              <TableHead>Etiqueta</TableHead>
              <TableHead>Tipo Campo</TableHead>
              <TableHead className="text-center">Oculto</TableHead>
              <TableHead className="text-center">Solo Lectura</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campos.map((campo) => (
              <TableRow key={campo.cdTemplateCampo} className={campo.snEsTitulo ? 'bg-blue-50' : ''}>
                <TableCell className="font-mono text-sm">{campo.nuOrden}</TableCell>
                <TableCell>
                  {campo.snEsTitulo ? (
                    <span className="flex items-center gap-1 text-blue-700">
                      <Heading className="h-4 w-4" />
                      Título
                    </span>
                  ) : (
                    <span className="text-gray-600">Campo</span>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {campo.snEsTitulo ? campo.dsTitulo : campo.dsNombreCampo}
                </TableCell>
                <TableCell>{campo.dsEtiqueta || '-'}</TableCell>
                <TableCell>
                  {!campo.snEsTitulo && campo.dsTipoCampo && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {campo.dsTipoCampo}
                      {campo.dsTipoCampo === 'Lista' && campo.dsTipoHerencia && (
                        <span className="ml-1 text-xs">
                          ({campo.dsTipoHerencia === 'NORMA' ? `Lista: ${campo.dsNombreLista}` : `Entidad: ${campo.dsEntidadCliente}`})
                        </span>
                      )}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {!campo.snEsTitulo && (
                    campo.snOculto ? (
                      <Check className="h-4 w-4 text-orange-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 mx-auto" />
                    )
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {!campo.snEsTitulo && (
                    campo.snSoloLectura ? (
                      <Check className="h-4 w-4 text-orange-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 mx-auto" />
                    )
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(campo)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(campo.cdTemplateCampo)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampo ? 'Editar Elemento' : 'Nuevo Elemento'}
            </DialogTitle>
            <DialogDescription>
              Defina si es un título de agrupación o un campo del template
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selector: Título o Campo */}
            <div className="space-y-3">
              <Label>Tipo de Elemento</Label>
              <RadioGroup
                value={tipoCampoElemento}
                onValueChange={(value: 'titulo' | 'campo') => setTipoCampoElemento(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="titulo" id="tipo-titulo" />
                  <Label htmlFor="tipo-titulo" className="cursor-pointer font-normal">
                    Título de Agrupación
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="campo" id="tipo-campo" />
                  <Label htmlFor="tipo-campo" className="cursor-pointer font-normal">
                    Campo
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="border-t pt-4">
              {tipoCampoElemento === 'titulo' ? (
                /* === FORMULARIO PARA TÍTULO === */
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dsTitulo">
                      Texto del Título <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dsTitulo"
                      value={formData.dsTitulo}
                      onChange={(e) => setFormData({ ...formData, dsTitulo: e.target.value })}
                      required
                      placeholder="Ej: Encabezado, Detalle, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="nuOrden">Orden</Label>
                    <Input
                      id="nuOrden"
                      type="number"
                      value={formData.nuOrden}
                      onChange={(e) => setFormData({ ...formData, nuOrden: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              ) : (
                /* === FORMULARIO PARA CAMPO === */
                <div className="space-y-4">
                  {/* Nombre y Etiqueta */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dsNombreCampo">
                        Nombre Campo <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="dsNombreCampo"
                        value={formData.dsNombreCampo}
                        onChange={(e) => setFormData({ ...formData, dsNombreCampo: e.target.value })}
                        required
                        placeholder="ej: empleado_nombre"
                      />
                      <p className="text-xs text-gray-500 mt-1">Sin espacios, usar guiones bajos</p>
                    </div>

                    <div>
                      <Label htmlFor="dsEtiqueta">Etiqueta</Label>
                      <Input
                        id="dsEtiqueta"
                        value={formData.dsEtiqueta}
                        onChange={(e) => setFormData({ ...formData, dsEtiqueta: e.target.value })}
                        placeholder="ej: Nombre del Empleado"
                      />
                    </div>
                  </div>

                  {/* Tipo de Campo y Orden */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cdTipoCampo">
                        Tipo de Campo <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.cdTipoCampo} onValueChange={handleTipoCampoChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposCampo.map((tipo) => (
                            <SelectItem key={tipo.cdTipoCampo} value={tipo.cdTipoCampo.toString()}>
                              {tipo.dsTipoCampo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="nuOrden">Orden</Label>
                      <Input
                        id="nuOrden"
                        type="number"
                        value={formData.nuOrden}
                        onChange={(e) => setFormData({ ...formData, nuOrden: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* === OPCIONES PARA TIPO LISTA === */}
                  {esLista && (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900">Configuración de Lista</h4>
                      
                      {/* Tipo de Herencia */}
                      <div>
                        <Label>Hereda de <span className="text-red-500">*</span></Label>
                        <RadioGroup
                          value={formData.dsTipoHerencia}
                          onValueChange={(value) => setFormData({ ...formData, dsTipoHerencia: value, cdLista: '', dsEntidadCliente: '', cdValorDefaultLista: '', tieneValorDefault: false })}
                          className="flex gap-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="NORMA" id="herencia-norma" />
                            <Label htmlFor="herencia-norma" className="cursor-pointer font-normal">
                              Norma (valores fijos)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="CLIENTE" id="herencia-cliente" />
                            <Label htmlFor="herencia-cliente" className="cursor-pointer font-normal">
                              Cliente (entidades dinámicas)
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Si hereda de NORMA */}
                      {formData.dsTipoHerencia === 'NORMA' && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="cdLista">
                              Seleccionar Lista <span className="text-red-500">*</span>
                            </Label>
                            <Select value={formData.cdLista} onValueChange={handleListaChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione lista" />
                              </SelectTrigger>
                              <SelectContent>
                                {listas.map((lista) => (
                                  <SelectItem key={lista.cdLista} value={lista.cdLista.toString()}>
                                    {lista.dsNombreLista}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {listas.length === 0 && (
                              <p className="text-xs text-orange-600 mt-1">
                                No hay listas creadas. Primero cree listas en la pestaña Listas.
                              </p>
                            )}
                          </div>

                          {/* Valor por defecto */}
                          {formData.cdLista && (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="tieneValorDefault"
                                checked={formData.tieneValorDefault}
                                onCheckedChange={(checked) =>
                                  setFormData({ ...formData, tieneValorDefault: checked as boolean, cdValorDefaultLista: '' })
                                }
                              />
                              <Label htmlFor="tieneValorDefault" className="cursor-pointer">
                                Tiene valor por defecto
                              </Label>
                            </div>
                          )}

                          {formData.tieneValorDefault && formData.cdLista && listasItems[parseInt(formData.cdLista)] && (
                            <div>
                              <Label htmlFor="cdValorDefaultLista">Valor por Defecto</Label>
                              <Select
                                value={formData.cdValorDefaultLista}
                                onValueChange={(value) => setFormData({ ...formData, cdValorDefaultLista: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione valor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {listasItems[parseInt(formData.cdLista)]
                                    ?.map((item) => (
                                      <SelectItem key={item.cdListaItem} value={item.cdListaItem.toString()}>
                                        {item.dsValor}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Si hereda de CLIENTE */}
                      {formData.dsTipoHerencia === 'CLIENTE' && (
                        <div>
                          <Label htmlFor="dsEntidadCliente">
                            Seleccionar Entidad del Cliente <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.dsEntidadCliente}
                            onValueChange={(value) => setFormData({ ...formData, dsEntidadCliente: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione entidad" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SECTORES">Sectores</SelectItem>
                              <SelectItem value="PUESTOS">Puestos</SelectItem>
                              <SelectItem value="EMPLEADOS">Empleados</SelectItem>
                              <SelectItem value="LISTAS_CONFIGURADAS">Listas Configuradas</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.dsEntidadCliente === 'LISTAS_CONFIGURADAS' 
                              ? 'El usuario seleccionará la lista y valor al completar el documento'
                              : 'Los valores se cargarán automáticamente del cliente al usar el template'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Valor por Defecto (para tipos NO lista) */}
                  {!esLista && (
                    <div>
                      <Label htmlFor="dsValorDefault">Valor por Defecto</Label>
                      <Input
                        id="dsValorDefault"
                        value={formData.dsValorDefault}
                        onChange={(e) => setFormData({ ...formData, dsValorDefault: e.target.value })}
                        placeholder="Valor predeterminado (opcional)"
                      />
                    </div>
                  )}

                  {/* Checkboxes de configuración */}
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-medium text-sm">Opciones de Campo</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="snObligatorio"
                          checked={formData.snObligatorio}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, snObligatorio: checked as boolean })
                          }
                        />
                        <Label htmlFor="snObligatorio" className="cursor-pointer">
                          Campo Obligatorio
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="snOculto"
                          checked={formData.snOculto}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, snOculto: checked as boolean })
                          }
                        />
                        <Label htmlFor="snOculto" className="cursor-pointer">
                          Oculto (no visible)
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 col-span-2">
                        <Checkbox
                          id="snSoloLectura"
                          checked={formData.snSoloLectura}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, snSoloLectura: checked as boolean })
                          }
                        />
                        <Label htmlFor="snSoloLectura" className="cursor-pointer">
                          Solo Lectura (visible pero no editable)
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingCampo ? 'Actualizar' : 'Crear'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {confirmAction && (
        <ConfirmDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          onConfirm={confirmAction.action}
          title={confirmAction.title}
          description={confirmAction.description}
          confirmText="Eliminar"
          variant="destructive"
        />
      )}
    </div>
  );
}
