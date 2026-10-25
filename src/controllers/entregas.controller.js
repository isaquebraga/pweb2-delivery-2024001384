import { ErroHttp } from '../utils/erro-http.js';
import { STATUS_ENTREGA, STATUS_MOTORISTA } from '../utils/status.js';

export class EntregasController {
  constructor(entregasService, motoristasService) {
    this.entregasService = entregasService;
    this.motoristasService = motoristasService;
  }

  listar = async (req, res, next) => {
    try {
      const filtro = req.query.status || undefined;
      const entregas = await this.entregasService.listar(filtro);
      res.render('entregas/index', { entregas, filtro, statusDisponiveis: Object.values(STATUS_ENTREGA) });
    } catch (erro) {
      next(erro);
    }
  };

  nova = (req, res) => {
    res.render('entregas/nova', { erros: [], dados: {} });
  };

  criar = async (req, res, next) => {
    try {
      const entrega = await this.entregasService.criar(req.body);
      req.flash('sucesso', `Entrega #${entrega.id} criada com sucesso`);
      res.redirect(`/entregas/${entrega.id}`);
    } catch (erro) {
      if (!(erro instanceof ErroHttp)) return next(erro);
      res.status(erro.status).render('entregas/nova', { erros: [erro.message], dados: req.body });
    }
  };

  detalhar = async (req, res, next) => {
    try {
      const entrega = await this.entregasService.buscarPorId(req.params.id);
      const motoristas = await this.motoristasService.listar();
      const motorista = motoristas.find((m) => m.id === entrega.motoristaId);
      const motoristasAtivos = motoristas.filter((m) => m.status === STATUS_MOTORISTA.ATIVO);
      res.render('entregas/detalhe', { entrega, motorista, motoristasAtivos });
    } catch (erro) {
      next(erro);
    }
  };

  avancar = async (req, res, next) => {
    await this.executarAcao(req, res, next, async () => {
      const entrega = await this.entregasService.avancar(req.params.id);
      return `Status alterado para ${entrega.status}`;
    });
  };

  cancelar = async (req, res, next) => {
    await this.executarAcao(req, res, next, async () => {
      await this.entregasService.cancelar(req.params.id);
      return 'Entrega cancelada';
    });
  };

  atribuir = async (req, res, next) => {
    await this.executarAcao(req, res, next, async () => {
      await this.entregasService.atribuir(req.params.id, req.body.motoristaId);
      return 'Motorista atribuído à entrega';
    });
  };

  async executarAcao(req, res, next, acao) {
    try {
      const entrega = await this.entregasService.buscarPorId(req.params.id);
      req.flash(...(await tentar(acao)));
      res.redirect(`/entregas/${entrega.id}`);
    } catch (erro) {
      next(erro);
    }
  }
}

async function tentar(acao) {
  try {
    return ['sucesso', await acao()];
  } catch (erro) {
    if (erro instanceof ErroHttp) return ['erro', erro.message];
    throw erro;
  }
}
