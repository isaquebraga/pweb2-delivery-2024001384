import { ErroHttp } from '../utils/erro-http.js';
import { STATUS_ENTREGA, STATUS_MOTORISTA } from '../utils/status.js';
import { limparTexto, validarFiltroDeStatus, validarId } from '../utils/validacoes.js';

const PROXIMO_STATUS = {
  [STATUS_ENTREGA.CRIADA]: STATUS_ENTREGA.EM_TRANSITO,
  [STATUS_ENTREGA.EM_TRANSITO]: STATUS_ENTREGA.ENTREGUE,
};

const STATUS_FINAIS = [STATUS_ENTREGA.ENTREGUE, STATUS_ENTREGA.CANCELADA];

export class EntregasService {
  /**
   * @param {import('../repositories/contratos.js').IEntregasRepository} entregasRepository
   * @param {import('../repositories/contratos.js').IMotoristasRepository} motoristasRepository
   */
  constructor(entregasRepository, motoristasRepository) {
    this.entregasRepository = entregasRepository;
    this.motoristasRepository = motoristasRepository;
  }

  async criar(dados) {
    const { descricao, origem, destino } = validarDadosDeCriacao(dados);

    if (await this.existeEntregaAtivaIgual(descricao, origem, destino)) {
      throw new ErroHttp(409, 'já existe uma entrega ativa com esses mesmos dados');
    }

    return this.entregasRepository.criar({
      descricao,
      origem,
      destino,
      status: STATUS_ENTREGA.CRIADA,
      motoristaId: null,
      historico: [criarEvento('Entrega criada com status CRIADA')],
    });
  }

  async listar(status) {
    return this.entregasRepository.listarTodos({ status: validarFiltroDeStatus(status) });
  }

  async buscarPorId(id) {
    const entrega = await this.entregasRepository.buscarPorId(validarId(id));

    if (!entrega) throw new ErroHttp(404, 'entrega não encontrada');

    return entrega;
  }

  async listarHistorico(id) {
    const entrega = await this.buscarPorId(id);

    return entrega.historico;
  }

  async avancar(id) {
    const entrega = await this.buscarPorId(id);
    const proximoStatus = PROXIMO_STATUS[entrega.status];

    if (!proximoStatus) {
      throw new ErroHttp(422, `não é possível avançar uma entrega ${entrega.status}`);
    }

    return this.mudarStatus(entrega, proximoStatus);
  }

  async cancelar(id) {
    const entrega = await this.buscarPorId(id);

    if (STATUS_FINAIS.includes(entrega.status)) {
      throw new ErroHttp(422, `não é possível cancelar uma entrega ${entrega.status}`);
    }

    return this.mudarStatus(entrega, STATUS_ENTREGA.CANCELADA);
  }

  async atribuir(id, motoristaId) {
    const entrega = await this.buscarPorId(id);
    const motorista = await this.motoristasRepository.buscarPorId(validarId(motoristaId, 'motoristaId'));

    if (!motorista) throw new ErroHttp(404, 'motorista não encontrado');

    if (entrega.status !== STATUS_ENTREGA.CRIADA) {
      throw new ErroHttp(422, `não é possível atribuir motorista a uma entrega ${entrega.status}`);
    }

    if (motorista.status !== STATUS_MOTORISTA.ATIVO) {
      throw new ErroHttp(422, `não é possível atribuir um motorista ${motorista.status}`);
    }

    return this.entregasRepository.atualizar(entrega.id, {
      motoristaId: motorista.id,
      historico: [...entrega.historico, criarEvento(`Entrega atribuída ao motorista ${motorista.nome}`)],
    });
  }

  async mudarStatus(entrega, novoStatus) {
    return this.entregasRepository.atualizar(entrega.id, {
      status: novoStatus,
      historico: [...entrega.historico, criarEvento(`Status alterado para ${novoStatus}`)],
    });
  }

  async existeEntregaAtivaIgual(descricao, origem, destino) {
    const entregas = await this.entregasRepository.listarTodos();

    return entregas.some(
      (entrega) =>
        !STATUS_FINAIS.includes(entrega.status) &&
        entrega.descricao === descricao &&
        entrega.origem === origem &&
        entrega.destino === destino,
    );
  }
}

function validarDadosDeCriacao(dados = {}) {
  const descricao = limparTexto(dados.descricao);
  const origem = limparTexto(dados.origem);
  const destino = limparTexto(dados.destino);

  if (!descricao) throw new ErroHttp(400, 'descricao é obrigatória');
  if (!origem) throw new ErroHttp(400, 'origem é obrigatória');
  if (!destino) throw new ErroHttp(400, 'destino é obrigatório');

  if (origem.toLowerCase() === destino.toLowerCase()) {
    throw new ErroHttp(400, 'origem e destino devem ser diferentes');
  }

  return { descricao, origem, destino };
}

function criarEvento(descricao) {
  return { data: new Date().toISOString(), descricao };
}
