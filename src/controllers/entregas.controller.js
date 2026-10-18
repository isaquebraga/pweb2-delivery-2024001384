import { responderErro } from '../utils/responder.js';

export class EntregasController {
  constructor(entregasService) {
    this.entregasService = entregasService;
  }

  criar = async (req, res) => {
    try {
      const entrega = await this.entregasService.criar(req.body);
      res.status(201).json(entrega);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  listar = async (req, res) => {
    try {
      const entregas = await this.entregasService.listar(req.query.status);
      res.status(200).json(entregas);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  buscarPorId = async (req, res) => {
    try {
      const entrega = await this.entregasService.buscarPorId(req.params.id);
      res.status(200).json(entrega);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  listarHistorico = async (req, res) => {
    try {
      const historico = await this.entregasService.listarHistorico(req.params.id);
      res.status(200).json(historico);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  avancar = async (req, res) => {
    try {
      const entrega = await this.entregasService.avancar(req.params.id);
      res.status(200).json(entrega);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  cancelar = async (req, res) => {
    try {
      const entrega = await this.entregasService.cancelar(req.params.id);
      res.status(200).json(entrega);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  atribuir = async (req, res) => {
    try {
      const entrega = await this.entregasService.atribuir(req.params.id, req.body.motoristaId);
      res.status(200).json(entrega);
    } catch (erro) {
      responderErro(res, erro);
    }
  };
}
