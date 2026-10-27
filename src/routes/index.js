import { Router } from 'express';

import { prisma } from '../config/database.js';
import { EntregasRepositoryPrisma } from '../repositories/entregas.repository.prisma.js';
import { MotoristasRepositoryPrisma } from '../repositories/motoristas.repository.prisma.js';
import { EntregasService } from '../services/entregas.service.js';
import { MotoristasService } from '../services/motoristas.service.js';
import { EntregasController } from '../controllers/entregas.controller.js';
import { MotoristasController } from '../controllers/motoristas.controller.js';
import { criarRotasDeEntregas } from './entregas.routes.js';
import { criarRotasDeMotoristas } from './motoristas.routes.js';

export function criarRotas() {
  const entregasRepository = new EntregasRepositoryPrisma(prisma);
  const motoristasRepository = new MotoristasRepositoryPrisma(prisma);

  const entregasService = new EntregasService(entregasRepository, motoristasRepository);
  const motoristasService = new MotoristasService(motoristasRepository, entregasRepository);

  const entregasController = new EntregasController(entregasService, motoristasService);
  const motoristasController = new MotoristasController(motoristasService);

  const rotas = Router();
  rotas.get('/', (req, res) => res.redirect('/entregas'));
  rotas.use('/entregas', criarRotasDeEntregas(entregasController));
  rotas.use('/motoristas', criarRotasDeMotoristas(motoristasController));

  return rotas;
}
