import { body } from 'express-validator';

export const regrasDeEntrega = [
  body('descricao').trim().notEmpty().withMessage('descricao é obrigatória'),
  body('origem').trim().notEmpty().withMessage('origem é obrigatória'),
  body('destino')
    .trim()
    .notEmpty()
    .withMessage('destino é obrigatório')
    .bail()
    .custom((destino, { req }) => destino.toLowerCase() !== (req.body.origem ?? '').toLowerCase())
    .withMessage('origem e destino devem ser diferentes'),
];
