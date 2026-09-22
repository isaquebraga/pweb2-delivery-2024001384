import { Router } from 'express';

export function criarRotasDeEntregas(entregasController) {
  const rotas = Router();

  rotas.post('/', entregasController.criar);
  rotas.get('/', entregasController.listar);
  rotas.get('/:id', entregasController.buscarPorId);
  rotas.get('/:id/historico', entregasController.listarHistorico);
  rotas.patch('/:id/avancar', entregasController.avancar);
  rotas.patch('/:id/cancelar', entregasController.cancelar);

  return rotas;
}
