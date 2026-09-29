import { Router } from 'express';

export function criarRotasDeMotoristas(motoristasController) {
  const rotas = Router();

  rotas.post('/', motoristasController.criar);
  rotas.get('/', motoristasController.listar);
  rotas.get('/:id', motoristasController.buscarPorId);
  rotas.get('/:id/entregas', motoristasController.listarEntregas);

  return rotas;
}
