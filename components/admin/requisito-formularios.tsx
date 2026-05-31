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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Settings, FileText, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TemplatesCamposList } from '@/components/admin/templates-campos-list';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface FormularioAsociado {
  cdTemplateDocumento: number;
  cdNorma: number;
  cdCodigo: string | null;
  dsNombre: string;
  dsVersionTemplate: string | null;
  snActivo: boolean;
  cdRequisitoTemplate: number;
}

interface FormularioDisponible {
  cdTemplateDocumento: number;
  cdNorma: number;
  cdCodigo: string | null;
  dsNombre: string;
  dsVersionTemplate: string | null;
  snActivo: boolean;
  nuRequisitosAsociados?: number;
}

interface RequisitoFormulariosProps {
  cdNorma: number;
  cdRequisito: number;
}

export function RequisitoFormularios({ cdNorma, cdRequisito }: RequisitoFormulariosProps) {
  const { toast } = useToast();
  const [formularios, setFormularios] = useState<FormularioAsociado[]>([]);
  const [loading, setLoading] = useState(true);
  const [asociarDialogOpen, setAsociarDialogOpen] = useState(false);
  const [camposDialogOpen, setCamposDialogOpen] = useState(false);
  const [selectedFormularioForCampos, setSelectedFormularioForCampos] = useState<FormularioAsociado | null>(null);
  const [formulariosDisponibles, setFormulariosDisponibles] = useState<FormularioDisponible[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormularios, setSelectedFormularios] = useState<Set<number>>(new Set());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [formularioToDelete, setFormularioToDelete] = useState<number | null>(null);

  useEffect(() => {
    loadFormulariosAsociados();
  }, [cdRequisito]);

  const loadFormulariosAsociados = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/requisitos/${cdRequisito}/formularios`);
      const data = await response.json();
      if (data.success) {
        setFormularios(data.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar formularios asociados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFormulariosDisponibles = async () => {
    try {
      const response = await fetch(`/api/admin/formularios?cdNorma=${cdNorma}`);
      const data = await response.json();
      if (data.success) {
        // Filtrar solo los activos y que no estén ya asociados
        const asociadosIds = new Set(formularios.map(f => f.cdTemplateDocumento));
        const disponibles = data.data.filter(
          (f: FormularioDisponible) => f.snActivo && !asociadosIds.has(f.cdTemplateDocumento)
        );
        setFormulariosDisponibles(disponibles);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar formularios disponibles',
        variant: 'destructive',
      });
    }
  };

  const handleOpenAsociarDialog = () => {
    setSelectedFormularios(new Set());
    setSearchTerm('');
    loadFormulariosDisponibles();
    setAsociarDialogOpen(true);
  };

  const handleToggleFormulario = (cdTemplateDocumento: number) => {
    const newSelected = new Set(selectedFormularios);
    if (newSelected.has(cdTemplateDocumento)) {
      newSelected.delete(cdTemplateDocumento);
    } else {
      newSelected.add(cdTemplateDocumento);
    }
    setSelectedFormularios(newSelected);
  };

  const handleAsociarFormularios = async () => {
    if (selectedFormularios.size === 0) {
      toast({
        title: 'Atención',
        description: 'Debe seleccionar al menos un formulario para asociar',
        variant: 'default',
      });
      return;
    }

    try {
      let success = 0;
      let errors = 0;

      for (const cdTemplateDocumento of selectedFormularios) {
        try {
          const response = await fetch(`/api/admin/requisitos/${cdRequisito}/formularios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cdTemplateDocumento }),
          });

          const data = await response.json();
          if (data.success) {
            success++;
          } else {
            errors++;
          }
        } catch (error) {
          errors++;
        }
      }

      if (success > 0) {
        toast({
          title: 'Éxito',
          description: `${success} formulario${success !== 1 ? 's' : ''} asociado${success !== 1 ? 's' : ''} correctamente${errors > 0 ? ` (${errors} error${errors !== 1 ? 'es' : ''})` : ''}`,
          variant: 'success',
        });
        setAsociarDialogOpen(false);
        loadFormulariosAsociados();
      } else {
        toast({
          title: 'Error',
          description: 'No se pudieron asociar los formularios',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al asociar formularios',
        variant: 'destructive',
      });
    }
  };

  const handleDesasociar = (cdTemplateDocumento: number) => {
    setFormularioToDelete(cdTemplateDocumento);
    setConfirmDialogOpen(true);
  };

  const executeDesasociar = async () => {
    if (!formularioToDelete) return;

    try {
      const response = await fetch(
        `/api/admin/requisitos/${cdRequisito}/formularios?cdTemplateDocumento=${formularioToDelete}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Formulario desasociado correctamente',
          variant: 'success',
        });
        loadFormulariosAsociados();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al desasociar formulario',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al desasociar formulario',
        variant: 'destructive',
      });
    }
  };

  const handleOpenCamposDialog = (formulario: FormularioAsociado) => {
    setSelectedFormularioForCampos(formulario);
    setCamposDialogOpen(true);
  };

  const filteredFormularios = formulariosDisponibles.filter(f =>
    f.dsNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.cdCodigo && f.cdCodigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="text-center py-4 text-sm text-gray-500">Cargando formularios...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {formularios.length} formulario{formularios.length !== 1 ? 's' : ''} asociado{formularios.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={handleOpenAsociarDialog} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Asociar Formulario
        </Button>
      </div>

      {/* Lista de Formularios Asociados */}
      {formularios.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-sm border rounded-lg bg-gray-50">
          No hay formularios asociados. Click en "Asociar Formulario" para agregar.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Versión</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formularios.map((formulario) => (
              <TableRow key={formulario.cdRequisitoTemplate}>
                <TableCell className="font-mono text-sm">
                  {formulario.cdCodigo || '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>{formulario.dsNombre}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {formulario.dsVersionTemplate || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenCamposDialog(formulario)}
                      title="Ver campos del formulario"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDesasociar(formulario.cdTemplateDocumento)}
                      title="Desasociar formulario"
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

      {/* Dialog Asociar Formularios */}
      <Dialog open={asociarDialogOpen} onOpenChange={setAsociarDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Asociar Formularios al Requisito</DialogTitle>
            <DialogDescription>
              Seleccione los formularios que desea asociar a este requisito. Solo se muestran los formularios activos que no están ya asociados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de Formularios Disponibles */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {filteredFormularios.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {formulariosDisponibles.length === 0
                    ? 'No hay formularios disponibles para asociar. Todos los formularios activos ya están asociados o no hay formularios creados.'
                    : 'No se encontraron formularios con ese criterio de búsqueda.'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Versión</TableHead>
                      <TableHead className="text-center">En Uso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFormularios.map((formulario) => (
                      <TableRow
                        key={formulario.cdTemplateDocumento}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleToggleFormulario(formulario.cdTemplateDocumento)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedFormularios.has(formulario.cdTemplateDocumento)}
                            onCheckedChange={() => handleToggleFormulario(formulario.cdTemplateDocumento)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formulario.cdCodigo || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span>{formulario.dsNombre}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formulario.dsVersionTemplate || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs text-gray-500">
                            {formulario.nuRequisitosAsociados || 0} req.
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Contador de seleccionados */}
            {selectedFormularios.size > 0 && (
              <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                {selectedFormularios.size} formulario{selectedFormularios.size !== 1 ? 's' : ''} seleccionado{selectedFormularios.size !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setAsociarDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAsociarFormularios}
              disabled={selectedFormularios.size === 0}
            >
              Asociar {selectedFormularios.size > 0 && `(${selectedFormularios.size})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Campos */}
      <Dialog open={camposDialogOpen} onOpenChange={setCamposDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campos del Formulario - {selectedFormularioForCampos?.dsNombre}</DialogTitle>
            <DialogDescription>
              Campos configurados para este formulario. Los cambios afectarán a todos los requisitos donde esté asociado.
            </DialogDescription>
          </DialogHeader>

          {selectedFormularioForCampos && (
            <TemplatesCamposList
              cdTemplateDocumento={selectedFormularioForCampos.cdTemplateDocumento}
              cdNorma={cdNorma}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Desasociar Formulario"
        description="¿Está seguro de desasociar este formulario del requisito? Los datos de certificaciones asociados no se eliminarán."
        onConfirm={executeDesasociar}
      />
    </div>
  );
}
