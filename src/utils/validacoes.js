import { ErroHttp } from './erro-http.js';

export function validarId(id, campo = 'id') {
  const numero = Number(id);

  if (!Number.isInteger(numero) || numero < 1) {
    throw new ErroHttp(400, `${campo} inválido: ${id}`);
  }

  return numero;
}

export function limparTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}
