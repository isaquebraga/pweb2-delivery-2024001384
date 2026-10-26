import { ErroHttp } from '../utils/erro-http.js';

export class MotoristasController {
  constructor(motoristasService) {
    this.motoristasService = motoristasService;
  }

  listar = async (req, res, next) => {
    try {
      const motoristas = await this.motoristasService.listar();
      res.render('motoristas/index', { motoristas });
    } catch (erro) {
      next(erro);
    }
  };

  novo = (req, res) => {
    res.render('motoristas/novo', { erros: [], dados: {} });
  };

  criar = async (req, res, next) => {
    try {
      const motorista = await this.motoristasService.criar(req.body);
      req.flash('sucesso', `Motorista ${motorista.nome} cadastrado com sucesso`);
      res.redirect('/motoristas');
    } catch (erro) {
      if (!(erro instanceof ErroHttp)) return next(erro);
      res.status(erro.status).render('motoristas/novo', { erros: [erro.message], dados: req.body });
    }
  };
}
