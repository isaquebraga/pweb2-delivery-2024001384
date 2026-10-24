import { body } from 'express-validator';

export const regrasDeMotorista = [
  body('nome').trim().notEmpty().withMessage('nome é obrigatório'),
  body('cpf').trim().notEmpty().withMessage('cpf é obrigatório'),
  body('placaVeiculo').trim(),
];
