'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Certificacion {
  cdCertificacion: number;
  dsNombreNorma: string;
  dsCodigo: string;
}

interface Requisito {
  cdRequisito: number;
  cdCodigoRequisito: string;
  dsRequisito: string;
}

interface Template {
  cdTemplateDocumento: number;
  dsNombreTemplate: string;
  registros: Registro[];
}

interface Registro {
  cdRegistroDocumento: number;
  dsTituloFormulario: string;
  dsEstadoDocumento: string;
  feModificacion: string;
}

interface CopiarRegistroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cdCertificacionActual: number;
  cdClienteActual: number;
  cdRequisito: number;
  dsRequisito: string;
  onSuccess: () => void;
}

export function CopiarRegistroDialog({
  open,
  onOpenChange,
  cdCertificacionActual,
  cdClienteActual,
  cdRequisito,
  dsRequisito,
  onSuccess
}: CopiarRegistroDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [certificaciones, setCertificaciones] = useState<Certificacion[]>([]);
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  
  const [certificacionSeleccionada, setCertificacionSeleccionada] = useState('');
  const [requisitoSeleccionado, setRequisitoSeleccionado] = useState('');
  const [templateSeleccionado, setTemplateSeleccionado] = useState('');
  const [registroSeleccionado, setRegistroSeleccionado] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');

  useEffect(() => {
    if (open) {
      loadCertificaciones();
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (certificacionSeleccionada) {
      loadRequisitos(parseInt(certificacionSeleccionada));
      setRequisitoSeleccionado('');
      setTemplateSeleccionado('');
      setRegistroSeleccionado('');
    }
  }, [certificacionSeleccionada]);

  useEffect(() => {
    if (requisitoSeleccionado && certificacionSeleccionada) {
      loadTemplates(parseInt(requisitoSeleccionado), parseInt(certificacionSeleccionada));
      setTemplateSeleccionado('');
      setRegistroSeleccionado('');
    }
  }, [requisitoSeleccionado]);

  useEffect(() => {
    if (templateSeleccionado) {
      const template = templates.find(t => t.cdTemplateDocumento.toString() === templateSeleccionado);
      if (template) {
        setRegistros(template.registros);
        setRegistroSeleccionado('');
        setNuevoNombre('');
      }
    }
  }, [templateSeleccionado]);

  useEffect(() => {
    if (registroSeleccionado) {
      const registro = registros.find(r => r.cdRegistroDocumento.toString() === registroSeleccionado);
      if (registro) {
        setNuevoNombre(registro.dsTituloFormulario);
      }
    }
  }, [registroSeleccionado]);

  const resetForm = () => {
    setCertificacionSeleccionada('');
    setRequisitoSeleccionado('');
    setTemplateSeleccionado('');
    setRegistroSeleccionado('');
    setNuevoNombre('');
    setRequisitos([]);
    setTemplates([]);
    setRegistros([]);
  };

  const loadCertificaciones = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/certificaciones?cdCliente=${cdClienteActual}`);
      const data = await res.json();
      if (data.success) {
        setCertificaciones(data.data);
      }
    } catch (error) {
      console.error('Error al cargar certificaciones:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las certificaciones',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRequisitos = async (cdCertificacion: number) => {
    try {
      const res = await fetch(`/api/admin/certificaciones/${cdCertificacion}/requisitos`);
      const data = await res.json();
      if (data.success) {
        setRequisitos(data.data);
      }
    } catch (error) {
      console.error('Error al cargar requisitos:', error);
    }
  };

  const loadTemplates = async (cdReq: number, cdCert: number) => {
    try {
      const res = await fetch(`/api/admin/requisitos/${cdReq}/registros?cdCertificacion=${cdCert}`);
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error al cargar templates:', error);
    }
  };

  const handleCopiar = async () => {
    if (!certificacionSeleccionada || !requisitoSeleccionado || !templateSeleccionado || !registroSeleccionado) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debe completar todos los campos',
      });
      return;
    }

    if (!nuevoNombre.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El nuevo nombre del formulario es requerido',
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/admin/requisitos/${cdRequisito}/copiar-registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cdCertificacion: cdCertificacionActual,
          cdRegistroDocumentoOrigen: parseInt(registroSeleccionado),
          dsNuevoNombre: nuevoNombre
        })
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Formulario copiado correctamente',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo copiar el formulario',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Copiar Formulario</DialogTitle>
          <DialogDescription>
            Requisito destino: <strong>{dsRequisito}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="certificacion">Certificación *</Label>
            <Select value={certificacionSeleccionada} onValueChange={setCertificacionSeleccionada}>
              <SelectTrigger id="certificacion">
                <SelectValue placeholder="Seleccione una certificación" />
              </SelectTrigger>
              <SelectContent>
                {certificaciones.map((cert) => (
                  <SelectItem 
                    key={cert.cdCertificacion} 
                    value={cert.cdCertificacion.toString()}
                  >
                    {cert.dsNombreNorma} {cert.dsCodigo ? `(${cert.dsCodigo})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {certificacionSeleccionada && (
            <div className="space-y-2">
              <Label htmlFor="requisito">Requisito *</Label>
              <Select value={requisitoSeleccionado} onValueChange={setRequisitoSeleccionado}>
                <SelectTrigger id="requisito">
                  <SelectValue placeholder="Seleccione un requisito" />
                </SelectTrigger>
                <SelectContent>
                  {requisitos.map((req) => (
                    <SelectItem 
                      key={req.cdRequisito} 
                      value={req.cdRequisito.toString()}
                    >
                      {req.cdCodigoRequisito} - {req.dsRequisito}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {requisitoSeleccionado && (
            <div className="space-y-2">
              <Label htmlFor="template">Formulario *</Label>
              <Select value={templateSeleccionado} onValueChange={setTemplateSeleccionado}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Seleccione un formulario" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem 
                      key={template.cdTemplateDocumento} 
                      value={template.cdTemplateDocumento.toString()}
                    >
                      {template.dsNombreTemplate} ({template.registros.length} registros)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {templateSeleccionado && registros.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="registro">Título Formulario *</Label>
              <Select value={registroSeleccionado} onValueChange={setRegistroSeleccionado}>
                <SelectTrigger id="registro">
                  <SelectValue placeholder="Seleccione un registro" />
                </SelectTrigger>
                <SelectContent>
                  {registros.map((reg) => (
                    <SelectItem 
                      key={reg.cdRegistroDocumento} 
                      value={reg.cdRegistroDocumento.toString()}
                    >
                      {reg.dsTituloFormulario} - {reg.dsEstadoDocumento} ({formatDate(reg.feModificacion)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {registroSeleccionado && (
            <div className="space-y-2">
              <Label htmlFor="nuevoNombre">Nuevo Nombre de Formulario *</Label>
              <Input
                id="nuevoNombre"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ingrese el nuevo nombre del formulario"
              />
            </div>
          )}

          {templateSeleccionado && registros.length === 0 && (
            <div className="text-sm text-gray-500 italic">
              Este formulario no tiene registros disponibles
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCopiar} disabled={loading}>
            {loading ? 'Copiando...' : 'Copiar Formulario'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
