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
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, FileText, ChevronDown, ChevronRight, Settings, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TemplatesCamposList } from '@/components/admin/templates-campos-list';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Template {
  cdTemplateDocumento: number;
  cdRequisito: number;
  cdCodigo: string | null;
  dsNombre: string;
  cdTipoDocumento: number | null;
  dsVersionTemplate: string | null;
  dsArchivoWord: string | null;
  dsNombreArchivo: string | null;
  snActivo: boolean;
}

interface Requisito {
  cdRequisito: number;
  cdNorma: number;
  cdCodigoRequisito: string | null;
  dsRequisito: string;
  dsDescripcion: string | null;
  nuOrden: number | null;
  cdEstado: number;
  dsEstado: string;
}

interface TemplatesListProps {
  cdNorma: number;
  cdRequisito?: number;
}

export function TemplatesList({ cdNorma, cdRequisito }: TemplatesListProps) {
  const { toast } = useToast();
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [templates, setTemplates] = useState<{ [key: number]: Template[] }>({});
  const [expandedRequisitos, setExpandedRequisitos] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [camposDialogOpen, setCamposDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedRequisito, setSelectedRequisito] = useState<number | null>(null);
  const [selectedTemplateForCampos, setSelectedTemplateForCampos] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    cdCodigo: '',
    dsNombre: '',
    dsVersionTemplate: '',
    dsNombreArchivo: '',
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'reactivate';
    cdTemplateDocumento: number;
    cdRequisito: number;
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    if (cdRequisito) {
      // Si se especifica un requisito, cargar solo sus templates
      loadTemplates(cdRequisito);
      setLoading(false);
    } else {
      // Si no, cargar todos los requisitos
      loadRequisitos();
    }
  }, [cdNorma, cdRequisito]);

  const loadRequisitos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/requisitos?cdNorma=${cdNorma}`);
      const data = await response.json();
      if (data.success) {
        setRequisitos(data.data);
        // Expandir automáticamente el primer requisito si existe
        if (data.data.length > 0) {
          const firstRequisito = data.data[0].cdRequisito;
          setExpandedRequisitos(new Set([firstRequisito]));
          loadTemplates(firstRequisito);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar requisitos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async (cdRequisito: number) => {
    try {
      const response = await fetch(`/api/admin/templates?cdRequisito=${cdRequisito}`);
      const data = await response.json();
      if (data.success) {
        setTemplates((prev) => ({ ...prev, [cdRequisito]: data.data }));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar templates',
        variant: 'destructive',
      });
    }
  };

  const toggleRequisito = (cdRequisito: number) => {
    const newExpanded = new Set(expandedRequisitos);
    if (newExpanded.has(cdRequisito)) {
      newExpanded.delete(cdRequisito);
    } else {
      newExpanded.add(cdRequisito);
      if (!templates[cdRequisito]) {
        loadTemplates(cdRequisito);
      }
    }
    setExpandedRequisitos(newExpanded);
  };

  const handleOpenDialog = (cdRequisito: number, template?: Template) => {
    setSelectedRequisito(cdRequisito);
    if (template) {
      setEditingTemplate(template);
      setFormData({
        cdCodigo: template.cdCodigo || '',
        dsNombre: template.dsNombre,
        dsVersionTemplate: template.dsVersionTemplate || '',
        dsNombreArchivo: template.dsNombreArchivo || '',
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        cdCodigo: '',
        dsNombre: '',
        dsVersionTemplate: '',
        dsNombreArchivo: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRequisito) return;

    try {
      const url = editingTemplate
        ? `/api/admin/templates/${editingTemplate.cdTemplateDocumento}`
        : '/api/admin/templates';

      const method = editingTemplate ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        cdRequisito: selectedRequisito,
        snActivo: editingTemplate?.snActivo !== undefined ? editingTemplate.snActivo : true,
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
          description: `Template ${editingTemplate ? 'actualizado' : 'creado'} correctamente`,
          variant: 'success',
        });
        setDialogOpen(false);
        loadTemplates(selectedRequisito);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al guardar template',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar template',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (cdTemplateDocumento: number, cdRequisito: number) => {
    setConfirmAction({
      type: 'delete',
      cdTemplateDocumento,
      cdRequisito,
      title: 'Desactivar Template',
      description: '¿Está seguro de desactivar este template? Podrá reactivarlo más adelante.',
    });
    setConfirmDialogOpen(true);
  };

  const handleReactivar = (cdTemplateDocumento: number, cdRequisito: number) => {
    setConfirmAction({
      type: 'reactivate',
      cdTemplateDocumento,
      cdRequisito,
      title: 'Reactivar Template',
      description: '¿Está seguro de reactivar este template?',
    });
    setConfirmDialogOpen(true);
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;

    const { type, cdTemplateDocumento, cdRequisito } = confirmAction;

    try {
      const url = type === 'delete'
        ? `/api/admin/templates/${cdTemplateDocumento}`
        : `/api/admin/templates/${cdTemplateDocumento}/reactivar`;
      const method = type === 'delete' ? 'DELETE' : 'POST';

      const response = await fetch(url, { method });
      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: type === 'delete' ? 'Template desactivado correctamente' : 'Template reactivado correctamente',
          variant: 'success',
        });
        loadTemplates(cdRequisito);
      } else {
        toast({
          title: 'Error',
          description: data.error || `Error al ${type === 'delete' ? 'desactivar' : 'reactivar'} template`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Error al ${type === 'delete' ? 'desactivar' : 'reactivar'} template`,
        variant: 'destructive',
      });
    }
  };

  const handleOpenCamposDialog = (template: Template) => {
    setSelectedTemplateForCampos(template);
    setCamposDialogOpen(true);
  };

  const renderDialogs = () => (
    <>
      {/* Dialog CRUD Template */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Nuevo Template'}
            </DialogTitle>
            <DialogDescription>Complete los datos del template de documento</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cdCodigo">Código</Label>
                <Input
                  id="cdCodigo"
                  value={formData.cdCodigo}
                  onChange={(e) => setFormData({ ...formData, cdCodigo: e.target.value })}
                  placeholder="Ej: TPL-001"
                />
              </div>

              <div>
                <Label htmlFor="dsVersionTemplate">Versión</Label>
                <Input
                  id="dsVersionTemplate"
                  value={formData.dsVersionTemplate}
                  onChange={(e) =>
                    setFormData({ ...formData, dsVersionTemplate: e.target.value })
                  }
                  placeholder="Ej: 1.0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dsNombre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dsNombre"
                value={formData.dsNombre}
                onChange={(e) => setFormData({ ...formData, dsNombre: e.target.value })}
                required
                placeholder="Nombre del template"
              />
            </div>

            <div>
              <Label htmlFor="dsNombreArchivo">Nombre del Archivo</Label>
              <Input
                id="dsNombreArchivo"
                value={formData.dsNombreArchivo}
                onChange={(e) =>
                  setFormData({ ...formData, dsNombreArchivo: e.target.value })
                }
                placeholder="documento.docx"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingTemplate ? 'Actualizar' : 'Crear'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para gestionar campos del template */}
      <Dialog open={camposDialogOpen} onOpenChange={setCamposDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Campos del Template</DialogTitle>
            <DialogDescription>
              Defina los campos dinámicos que contendrá este template
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplateForCampos && (
            <TemplatesCamposList 
              cdTemplateDocumento={selectedTemplateForCampos.cdTemplateDocumento}
              dsNombreTemplate={selectedTemplateForCampos.dsNombre}
              cdNorma={cdNorma}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación */}
      {confirmAction && (
        <ConfirmDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          onConfirm={executeConfirmAction}
          title={confirmAction.title}
          description={confirmAction.description}
          confirmText={confirmAction.type === 'delete' ? 'Desactivar' : 'Reactivar'}
          variant={confirmAction.type === 'delete' ? 'destructive' : 'default'}
        />
      )}
    </>
  );

  if (loading) {
    return <div className="text-center py-4">Cargando información...</div>;
  }

  // Si se especifica un requisito, mostrar solo sus templates
  if (cdRequisito) {
    const requisitoTemplates = templates[cdRequisito] || [];
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {requisitoTemplates.length} template{requisitoTemplates.length !== 1 ? 's' : ''}
          </span>
          <Button
            size="sm"
            onClick={() => handleOpenDialog(cdRequisito)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Template
          </Button>
        </div>

        {requisitoTemplates.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No hay templates. Click en "Nuevo Template" para agregar uno.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Versión</TableHead>
                <TableHead>Archivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requisitoTemplates.map((template) => (
                <TableRow key={template.cdTemplateDocumento}>
                  <TableCell className="font-medium">{template.dsNombre}</TableCell>
                  <TableCell>{template.cdCodigo || '-'}</TableCell>
                  <TableCell>{template.dsVersionTemplate || '-'}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {template.dsNombreArchivo || '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        template.snActivo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {template.snActivo ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenCamposDialog(template)}
                        title="Configurar campos"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(cdRequisito, template)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {template.snActivo ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.cdTemplateDocumento, cdRequisito)}
                          title="Desactivar template"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReactivar(template.cdTemplateDocumento, cdRequisito)}
                          title="Reactivar template"
                        >
                          <RefreshCw className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Dialogs */}
        {renderDialogs()}
      </div>
    );
  }

  if (requisitos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No hay requisitos cargados.</p>
        <p className="text-sm mt-2">Primero debe crear requisitos en la pestaña Requisitos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Templates de Documentos por Requisito</h3>
      </div>

      <div className="space-y-2">
        {requisitos.map((requisito) => {
          const isExpanded = expandedRequisitos.has(requisito.cdRequisito);
          const requisitoTemplates = templates[requisito.cdRequisito] || [];

          return (
            <div key={requisito.cdRequisito} className="border rounded-lg overflow-hidden">
              {/* Header del Requisito */}
              <div
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleRequisito(requisito.cdRequisito)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <p className="font-medium">
                      {requisito.cdCodigoRequisito && `${requisito.cdCodigoRequisito} - `}
                      {requisito.dsRequisito}
                    </p>
                    {requisito.dsDescripcion && (
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {requisito.dsDescripcion}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDialog(requisito.cdRequisito);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Template
                </Button>
              </div>

              {/* Contenido expandible - Templates */}
              {isExpanded && (
                <div className="p-4 bg-white">
                  {requisitoTemplates.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No hay templates para este requisito</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Versión</TableHead>
                          <TableHead>Archivo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requisitoTemplates.map((template) => (
                          <TableRow key={template.cdTemplateDocumento}>
                            <TableCell className="font-medium">
                              {template.cdCodigo || '-'}
                            </TableCell>
                            <TableCell>{template.dsNombre}</TableCell>
                            <TableCell>{template.dsVersionTemplate || '-'}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {template.dsNombreArchivo || '-'}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  template.snActivo
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {template.snActivo ? 'Activo' : 'Inactivo'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTemplateForCampos(template);
                                    setCamposDialogOpen(true);
                                  }}
                                  title="Configurar Campos"
                                >
                                  <Settings className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenDialog(requisito.cdRequisito, template)
                                  }
                                  title="Editar"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {template.snActivo ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDelete(
                                        template.cdTemplateDocumento,
                                        requisito.cdRequisito
                                      )
                                    }
                                    title="Desactivar template"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleReactivar(
                                        template.cdTemplateDocumento,
                                        requisito.cdRequisito
                                      )
                                    }
                                    title="Reactivar template"
                                  >
                                    <RefreshCw className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      {renderDialogs()}
    </div>
  );
}
