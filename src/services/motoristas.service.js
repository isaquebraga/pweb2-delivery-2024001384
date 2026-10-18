import { ErroHttp } from '../utils/erro-http.js';
import { STATUS_MOTORISTA } from '../utils/status.js';
import { limparTexto, validarFiltroDeStatus, validarId } from '../utils/validacoes.js';

export class MotoristasService {
  /**
   * @param {import('../repositories/contratos.js').IMotoristasRepository} motoristasRepository
   * @param {import('../repositories/contratos.js').IEntregasRepository} entregasRepository
   */
  constructor(motoristasRepository, entregasRepository) {
    this.motoristasRepository = motoristasRepository;
    this.entregasRepository = entregasRepository;
  }

  async criar(dados) {
    const { nome, cpf, placaVeiculo } = validarDadosDeCriacao(dados);

    if (await this.motoristasRepository.buscarPorCpf(cpf)) {
      throw new ErroHttp(409, `já existe um motorista cadastrado com o cpf ${cpf}`);
    }

    return this.motoristasRepository.criar({
      nome,
      cpf,
      placaVeiculo,
      status: STATUS_MOTORISTA.ATIVO,
    });
  }

  async listar() {
    return this.motoristasRepository.listarTodos();
  }

  async buscarPorId(id) {
    const motorista = await this.motoristasRepository.buscarPorId(validarId(id));

    if (!motorista) throw new ErroHttp(404, 'motorista não encontrado');

    return motorista;
  }

  async listarEntregas(id, status) {
    const motorista = await this.buscarPorId(id);

    return this.entregasRepository.listarTodos({
      motoristaId: motorista.id,
      status: validarFiltroDeStatus(status),
    });
  }
}

function validarDadosDeCriacao(dados = {}) {
  const nome = limparTexto(dados.nome);
  const cpf = limparTexto(dados.cpf);
  const placaVeiculo = limparTexto(dados.placaVeiculo) || null;

  if (!nome) throw new ErroHttp(400, 'nome é obrigatório');
  if (!cpf) throw new ErroHttp(400, 'cpf é obrigatório');

  return { nome, cpf, placaVeiculo };
}
