'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Pencil, Trash2, Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClientesUsuariosListProps {
  cdCliente: number;
  cdEmpresaConsultora: number;
}

export function ClientesUsuariosList({ cdCliente, cdEmpresaConsultora }: ClientesUsuariosListProps) {
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [puestos, setPuestos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dsApellidoNombre: '',
    cdPuesto: '',
    feNacimiento: '',
    dsCUIT: '',
    dsDNI: '',
    dsCelularParticular: '',
    dsDomicilioCalle: '',
    dsDomicilioNumero: '',
    dsDomicilioLocalidad: '',
    feIngreso: '',
    nuSueldoActual: '',
    dsObservaciones: '',
  });

  useEffect(() => {
    loadUsuarios();
    loadPuestos();
  }, [cdCliente]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/clientes-usuarios?cdCliente=${cdCliente}`);
      const data = await response.json();
      
      if (data.success) {
        setUsuarios(data.data);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPuestos = async () => {
    try {
      const response = await fetch(`/api/admin/puestos?cdCliente=${cdCliente}`);
      const data = await response.json();
      
      if (data.success) {
        setPuestos(data.data);
      }
    } catch (error) {
      console.error('Error al cargar puestos:', error);
    }
  };

  const handleOpenDialog = (usuario?: any) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setFormData({
        dsApellidoNombre: usuario.dsApellidoNombre || '',
        cdPuesto: usuario.cdPuesto?.toString() || '',
        feNacimiento: usuario.feNacimiento ? usuario.feNacimiento.split('T')[0] : '',
        dsCUIT: usuario.dsCUIT || '',
        dsDNI: usuario.dsDNI || '',
        dsCelularParticular: usuario.dsCelularParticular || '',
        dsDomicilioCalle: usuario.dsDomicilioCalle || '',
        dsDomicilioNumero: usuario.dsDomicilioNumero || '',
        dsDomicilioLocalidad: usuario.dsDomicilioLocalidad || '',
        feIngreso: usuario.feIngreso ? usuario.feIngreso.split('T')[0] : '',
        nuSueldoActual: usuario.nuSueldoActual?.toString() || '',
        dsObservaciones: usuario.dsObservaciones || '',
      });
    } else {
      setEditingUsuario(null);
      setFormData({
        dsApellidoNombre: '',
        cdPuesto: '',
        feNacimiento: '',
        dsCUIT: '',
        dsDNI: '',
        dsCelularParticular: '',
        dsDomicilioCalle: '',
        dsDomicilioNumero: '',
        dsDomicilioLocalidad: '',
        feIngreso: '',
        nuSueldoActual: '',
        dsObservaciones: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingUsuario
        ? `/api/admin/clientes-usuarios/${editingUsuario.cdClienteUsuario}`
        : '/api/admin/clientes-usuarios';
      const method = editingUsuario ? 'PUT' : 'POST';

      const dataToSend = editingUsuario
        ? formData
        : { ...formData, cdEmpresaConsultora, cdCliente };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (data.success) {
        setDialogOpen(false);
        loadUsuarios();
        toast({
          title: editingUsuario ? "Empleado actualizado" : "Empleado creado",
          description: editingUsuario ? "El empleado se actualizó correctamente" : "El empleado se creó correctamente",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || 'Error al guardar empleado',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cdClienteUsuario: number) => {
    if (!confirm('¿Está seguro de eliminar este empleado?')) return;

    try {
      const response = await fetch(`/api/admin/clientes-usuarios/${cdClienteUsuario}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        loadUsuarios();
        toast({
          title: "Empleado eliminado",
          description: "El empleado se eliminó correctamente",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || 'Error al eliminar empleado',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
          {usuarios.length} empleado(s) registrado(s)
        </p>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Empleado
        </Button>
      </div>

      {usuarios.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay empleados registrados. Haz clic en &quot;Nuevo Empleado&quot; para agregar uno.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Apellido y Nombre</TableHead>
              <TableHead>Puesto</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Celular</TableHead>
              <TableHead>Ingreso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.cdClienteUsuario}>
                <TableCell className="font-medium">{usuario.dsApellidoNombre}</TableCell>
                <TableCell>{usuario.dsPuesto || '-'}</TableCell>
                <TableCell>{usuario.dsDNI || '-'}</TableCell>
                <TableCell>{usuario.dsCelularParticular || '-'}</TableCell>
                <TableCell>{formatDate(usuario.feIngreso)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    usuario.cdEstado === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {usuario.dsEstado}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(usuario)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(usuario.cdClienteUsuario)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog para Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUsuario ? 'Editar Empleado' : 'Nuevo Empleado'}
            </DialogTitle>
            <DialogDescription>
              {editingUsuario
                ? 'Modifica los datos del empleado'
                : 'Completa los datos del nuevo empleado'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Información Personal */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold mb-3 text-blue-700">Información Personal</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="dsApellidoNombre">Apellido y Nombre *</Label>
                    <Input
                      id="dsApellidoNombre"
                      value={formData.dsApellidoNombre}
                      onChange={(e) =>
                        setFormData({ ...formData, dsApellidoNombre: e.target.value })
                      }
                      required
                      placeholder="Ej: Pérez, Juan Carlos"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dsDNI">DNI</Label>
                    <Input
                      id="dsDNI"
                      value={formData.dsDNI}
                      onChange={(e) =>
                        setFormData({ ...formData, dsDNI: e.target.value })
                      }
                      placeholder="12345678"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dsCUIT">CUIL/CUIT</Label>
                    <Input
                      id="dsCUIT"
                      value={formData.dsCUIT}
                      onChange={(e) =>
                        setFormData({ ...formData, dsCUIT: e.target.value })
                      }
                      placeholder="20-12345678-9"
                    />
                  </div>

                  <div>
                    <Label htmlFor="feNacimiento">Fecha de Nacimiento</Label>
                    <Input
                      id="feNacimiento"
                      type="date"
                      value={formData.feNacimiento}
                      onChange={(e) =>
                        setFormData({ ...formData, feNacimiento: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="dsCelularParticular">Celular</Label>
                    <Input
                      id="dsCelularParticular"
                      value={formData.dsCelularParticular}
                      onChange={(e) =>
                        setFormData({ ...formData, dsCelularParticular: e.target.value })
                      }
                      placeholder="+54 9 11 1234-5678"
                    />
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold mb-3 text-blue-700">Información Laboral</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cdPuesto">Puesto</Label>
                    <Select
                      value={formData.cdPuesto}
                      onValueChange={(value) =>
                        setFormData({ ...formData, cdPuesto: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione puesto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {puestos.map((puesto) => (
                          <SelectItem key={puesto.cdPuesto} value={puesto.cdPuesto.toString()}>
                            {puesto.dsPuesto}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="feIngreso">Fecha de Ingreso</Label>
                    <Input
                      id="feIngreso"
                      type="date"
                      value={formData.feIngreso}
                      onChange={(e) =>
                        setFormData({ ...formData, feIngreso: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="nuSueldoActual">Sueldo Actual</Label>
                    <Input
                      id="nuSueldoActual"
                      type="number"
                      step="0.01"
                      value={formData.nuSueldoActual}
                      onChange={(e) =>
                        setFormData({ ...formData, nuSueldoActual: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Domicilio */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold mb-3 text-blue-700">Domicilio</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dsDomicilioCalle">Calle</Label>
                    <Input
                      id="dsDomicilioCalle"
                      value={formData.dsDomicilioCalle}
                      onChange={(e) =>
                        setFormData({ ...formData, dsDomicilioCalle: e.target.value })
                      }
                      placeholder="Nombre de la calle"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dsDomicilioNumero">Número</Label>
                    <Input
                      id="dsDomicilioNumero"
                      value={formData.dsDomicilioNumero}
                      onChange={(e) =>
                        setFormData({ ...formData, dsDomicilioNumero: e.target.value })
                      }
                      placeholder="1234"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="dsDomicilioLocalidad">Localidad</Label>
                    <Input
                      id="dsDomicilioLocalidad"
                      value={formData.dsDomicilioLocalidad}
                      onChange={(e) =>
                        setFormData({ ...formData, dsDomicilioLocalidad: e.target.value })
                      }
                      placeholder="Ciudad/Localidad"
                    />
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <Label htmlFor="dsObservaciones">Observaciones</Label>
                <Textarea
                  id="dsObservaciones"
                  value={formData.dsObservaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, dsObservaciones: e.target.value })
                  }
                  placeholder="Observaciones adicionales"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingUsuario ? 'Guardar Cambios' : 'Crear Empleado'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
