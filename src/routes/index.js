import { Router } from 'express';

import { criarBancoEmMemoria } from '../database/banco-em-memoria.js';
import { EntregasRepository } from '../repositories/entregas.repository.js';
import { EntregasService } from '../services/entregas.service.js';
import { EntregasController } from '../controllers/entregas.controller.js';
import { criarRotasDeEntregas } from './entregas.routes.js';

export function criarRotas() {
  const banco = criarBancoEmMemoria();
  const entregasRepository = new EntregasRepository(banco);
  const entregasService = new EntregasService(entregasRepository);
  const entregasController = new EntregasController(entregasService);

  const rotas = Router();
  rotas.use('/entregas', criarRotasDeEntregas(entregasController));

  return rotas;
}
