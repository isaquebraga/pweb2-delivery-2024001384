import { Router } from 'express';

import { validar } from '../middlewares/validar.js';
import { regrasDeMotorista } from '../validators/motoristas.validator.js';

export function criarRotasDeMotoristas(motoristasController) {
  const rotas = Router();

  rotas.get('/', motoristasController.listar);
  rotas.get('/novo', motoristasController.novo);
  rotas.post('/', validar(regrasDeMotorista, 'motoristas/novo'), motoristasController.criar);

  return rotas;
}
