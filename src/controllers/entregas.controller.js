import { responderErro } from '../utils/responder.js';

export class EntregasController {
  constructor(entregasService) {
    this.entregasService = entregasService;
  }

  criar = (req, res) => {
    try {
      const entrega = this.entregasService.criar(req.body);
      res.status(201).json(entrega);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  listar = (req, res) => {
    try {
      const entregas = this.entregasService.listar(req.query.status);
      res.status(200).json(entregas);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  buscarPorId = (req, res) => {
    try {
      const entrega = this.entregasService.buscarPorId(req.params.id);
      res.status(200).json(entrega);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  listarHistorico = (req, res) => {
    try {
      const historico = this.entregasService.listarHistorico(req.params.id);
      res.status(200).json(historico);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  avancar = (req, res) => {
    try {
      const entrega = this.entregasService.avancar(req.params.id);
      res.status(200).json(entrega);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  cancelar = (req, res) => {
    try {
      const entrega = this.entregasService.cancelar(req.params.id);
      res.status(200).json(entrega);
    } catch (erro) {
      responderErro(res, erro);
    }
  };
}
