'use client';

import { ListasCliente } from './listas-cliente';

interface ListasClienteListProps {
  cdCliente: number;
  cdEmpresaConsultora: number;
}

export function ListasClienteList({ cdCliente, cdEmpresaConsultora }: ListasClienteListProps) {
  return (
    <ListasCliente 
      cdCliente={cdCliente} 
      cdEmpresaConsultora={cdEmpresaConsultora}
    />
  );
}
