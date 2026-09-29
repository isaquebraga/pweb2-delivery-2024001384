import { ErroHttp } from './erro-http.js';
import { STATUS_ENTREGA } from './status.js';

export function validarId(id, campo = 'id') {
  const numero = Number(id);

  if (!Number.isInteger(numero) || numero < 1) {
    throw new ErroHttp(400, `${campo} inválido: ${id}`);
  }

  return numero;
}

export function validarFiltroDeStatus(status) {
  if (status !== undefined && !Object.hasOwn(STATUS_ENTREGA, status)) {
    throw new ErroHttp(400, `status inválido: ${status}`);
  }

  return status;
}

export function limparTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}
