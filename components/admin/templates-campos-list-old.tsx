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
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TemplateCampo {
  cdTemplateCampo: number;
  cdTemplateDocumento: number;
  dsNombreCampo: string;
  dsEtiqueta: string | null;
  cdTipoCampo: number;
  dsTipoCampo: string;
  dsValorDefault: string | null;
  snHeredaCliente: boolean;
  snObligatorio: boolean;
  cdLista: number | null;
  dsNombreLista: string | null;
  nuOrden: number;
}

interface TipoCampo {
  cdTipoCampo: number;
  dsTipoCampo: string;
  dsDescripcion: string;
}

interface TemplatesCamposListProps {
  cdTemplateDocumento: number;
  dsNombreTemplate: string;
}

export function TemplatesCamposList({ cdTemplateDocumento, dsNombreTemplate }: TemplatesCamposListProps) {
  const { toast } = useToast();
  const [campos, setCampos] = useState<TemplateCampo[]>([]);
  const [tiposCampo, setTiposCampo] = useState<TipoCampo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampo, setEditingCampo] = useState<TemplateCampo | null>(null);
  const [formData, setFormData] = useState({
    dsNombreCampo: '',
    dsEtiqueta: '',
    cdTipoCampo: '',
    dsValorDefault: '',
    snHeredaCliente: false,
    snObligatorio: false,
    nuOrden: '',
  });

  useEffect(() => {
    loadTiposCampo();
    loadCampos();
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

  const handleOpenDialog = (campo?: TemplateCampo) => {
    if (campo) {
      setEditingCampo(campo);
      setFormData({
        dsNombreCampo: campo.dsNombreCampo,
        dsEtiqueta: campo.dsEtiqueta || '',
        cdTipoCampo: campo.cdTipoCampo.toString(),
        dsValorDefault: campo.dsValorDefault || '',
        snHeredaCliente: campo.snHeredaCliente,
        snObligatorio: campo.snObligatorio,
        nuOrden: campo.nuOrden.toString(),
      });
    } else {
      setEditingCampo(null);
      setFormData({
        dsNombreCampo: '',
        dsEtiqueta: '',
        cdTipoCampo: '1',
        dsValorDefault: '',
        snHeredaCliente: false,
        snObligatorio: false,
        nuOrden: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCampo
        ? `/api/admin/templates-campos/${editingCampo.cdTemplateCampo}`
        : '/api/admin/templates-campos';

      const method = editingCampo ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        cdTemplateDocumento,
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
          description: `Campo ${editingCampo ? 'actualizado' : 'creado'} correctamente`,
          variant: 'success',
        });
        setDialogOpen(false);
        loadCampos();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al guardar campo',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar campo',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (cdTemplateCampo: number) => {
    if (!confirm('¿Está seguro de eliminar este campo?')) return;

    try {
      const response = await fetch(`/api/admin/templates-campos/${cdTemplateCampo}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Campo eliminado correctamente',
          variant: 'success',
        });
        loadCampos();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al eliminar campo',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar campo',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando campos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Campos del Template</h3>
          <p className="text-sm text-gray-500">{dsNombreTemplate}</p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Campo
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
              <TableHead>Nombre Campo</TableHead>
              <TableHead>Etiqueta</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor Default</TableHead>
              <TableHead className="text-center">Obligatorio</TableHead>
              <TableHead className="text-center">Hereda Cliente</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campos.map((campo) => (
              <TableRow key={campo.cdTemplateCampo}>
                <TableCell className="font-mono text-sm">
                  {campo.dsNombreCampo}
                </TableCell>
                <TableCell>{campo.dsEtiqueta || '-'}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {campo.dsTipoCampo}
                  </span>
                </TableCell>
                <TableCell className="text-sm max-w-xs truncate">
                  {campo.dsValorDefault || '-'}
                </TableCell>
                <TableCell className="text-center">
                  {campo.snObligatorio ? (
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {campo.snHeredaCliente ? (
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                  )}
                </TableCell>
                <TableCell>{campo.nuOrden}</TableCell>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCampo ? 'Editar Campo' : 'Nuevo Campo'}
            </DialogTitle>
            <DialogDescription>
              Defina los atributos del campo del template
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dsNombreCampo">
                  Nombre Campo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dsNombreCampo"
                  value={formData.dsNombreCampo}
                  onChange={(e) =>
                    setFormData({ ...formData, dsNombreCampo: e.target.value })
                  }
                  required
                  placeholder="ej: empleado_nombre"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sin espacios, usar guiones bajos
                </p>
              </div>

              <div>
                <Label htmlFor="dsEtiqueta">Etiqueta</Label>
                <Input
                  id="dsEtiqueta"
                  value={formData.dsEtiqueta}
                  onChange={(e) =>
                    setFormData({ ...formData, dsEtiqueta: e.target.value })
                  }
                  placeholder="ej: Nombre del Empleado"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cdTipoCampo">
                  Tipo de Campo <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.cdTipoCampo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, cdTipoCampo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposCampo.map((tipo) => (
                      <SelectItem
                        key={tipo.cdTipoCampo}
                        value={tipo.cdTipoCampo.toString()}
                      >
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
                  onChange={(e) =>
                    setFormData({ ...formData, nuOrden: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dsValorDefault">Valor por Defecto</Label>
              <Input
                id="dsValorDefault"
                value={formData.dsValorDefault}
                onChange={(e) =>
                  setFormData({ ...formData, dsValorDefault: e.target.value })
                }
                placeholder="Valor predeterminado (opcional)"
              />
            </div>

            <div className="flex gap-6">
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
                  id="snHeredaCliente"
                  checked={formData.snHeredaCliente}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, snHeredaCliente: checked as boolean })
                  }
                />
                <Label htmlFor="snHeredaCliente" className="cursor-pointer">
                  Hereda de Cliente
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingCampo ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
