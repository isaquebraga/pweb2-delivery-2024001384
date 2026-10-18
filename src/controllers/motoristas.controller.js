import { responderErro } from '../utils/responder.js';

export class MotoristasController {
  constructor(motoristasService) {
    this.motoristasService = motoristasService;
  }

  criar = async (req, res) => {
    try {
      const motorista = await this.motoristasService.criar(req.body);
      res.status(201).json(motorista);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  listar = async (req, res) => {
    try {
      const motoristas = await this.motoristasService.listar();
      res.status(200).json(motoristas);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  buscarPorId = async (req, res) => {
    try {
      const motorista = await this.motoristasService.buscarPorId(req.params.id);
      res.status(200).json(motorista);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  listarEntregas = async (req, res) => {
    try {
      const entregas = await this.motoristasService.listarEntregas(req.params.id, req.query.status);
      res.status(200).json(entregas);
    } catch (erro) {
      responderErro(res, erro);
    }
  };
}
