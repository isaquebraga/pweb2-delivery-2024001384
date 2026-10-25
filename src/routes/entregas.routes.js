import { Router } from 'express';

import { validar } from '../middlewares/validar.js';
import { regrasDeEntrega } from '../validators/entregas.validator.js';

export function criarRotasDeEntregas(entregasController) {
  const rotas = Router();

  rotas.get('/', entregasController.listar);
  rotas.get('/nova', entregasController.nova);
  rotas.post('/', validar(regrasDeEntrega, 'entregas/nova'), entregasController.criar);
  rotas.get('/:id', entregasController.detalhar);
  rotas.patch('/:id/avancar', entregasController.avancar);
  rotas.patch('/:id/cancelar', entregasController.cancelar);
  rotas.patch('/:id/atribuir', entregasController.atribuir);

  return rotas;
}
