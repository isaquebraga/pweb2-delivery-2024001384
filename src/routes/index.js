import { Router } from 'express';

import { criarBancoEmMemoria } from '../database/banco-em-memoria.js';
import { EntregasRepository } from '../repositories/entregas.repository.js';
import { MotoristasRepository } from '../repositories/motoristas.repository.js';
import { EntregasService } from '../services/entregas.service.js';
import { MotoristasService } from '../services/motoristas.service.js';
import { EntregasController } from '../controllers/entregas.controller.js';
import { MotoristasController } from '../controllers/motoristas.controller.js';
import { criarRotasDeEntregas } from './entregas.routes.js';
import { criarRotasDeMotoristas } from './motoristas.routes.js';

export function criarRotas() {
  const banco = criarBancoEmMemoria();

  const entregasRepository = new EntregasRepository(banco);
  const motoristasRepository = new MotoristasRepository(banco);

  const entregasService = new EntregasService(entregasRepository);
  const motoristasService = new MotoristasService(motoristasRepository, entregasRepository);

  const entregasController = new EntregasController(entregasService);
  const motoristasController = new MotoristasController(motoristasService);

  const rotas = Router();
  rotas.use('/entregas', criarRotasDeEntregas(entregasController));
  rotas.use('/motoristas', criarRotasDeMotoristas(motoristasController));

  return rotas;
}
