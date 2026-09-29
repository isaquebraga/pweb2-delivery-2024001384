import { responderErro } from '../utils/responder.js';

export class MotoristasController {
  constructor(motoristasService) {
    this.motoristasService = motoristasService;
  }

  criar = (req, res) => {
    try {
      const motorista = this.motoristasService.criar(req.body);
      res.status(201).json(motorista);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  listar = (req, res) => {
    try {
      const motoristas = this.motoristasService.listar();
      res.status(200).json(motoristas);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  buscarPorId = (req, res) => {
    try {
      const motorista = this.motoristasService.buscarPorId(req.params.id);
      res.status(200).json(motorista);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  listarEntregas = (req, res) => {
    try {
      const entregas = this.motoristasService.listarEntregas(req.params.id, req.query.status);
      res.status(200).json(entregas);
    } catch (erro) {
      responderErro(res, erro);
    }
  };
}
