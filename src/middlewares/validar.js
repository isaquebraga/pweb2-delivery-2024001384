import { validationResult } from 'express-validator';

export function validar(regras, view) {
  return [
    ...regras,
    (req, res, next) => {
      const resultado = validationResult(req);
      if (resultado.isEmpty()) return next();

      res.status(400).render(view, {
        erros: resultado.array().map((erro) => erro.msg),
        dados: req.body,
      });
    },
  ];
}
