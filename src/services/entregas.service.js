import { ErroHttp } from '../utils/erro-http.js';
import { STATUS_ENTREGA } from '../utils/status.js';
import { limparTexto, validarId } from '../utils/validacoes.js';

const PROXIMO_STATUS = {
  [STATUS_ENTREGA.CRIADA]: STATUS_ENTREGA.EM_TRANSITO,
  [STATUS_ENTREGA.EM_TRANSITO]: STATUS_ENTREGA.ENTREGUE,
};

const STATUS_FINAIS = [STATUS_ENTREGA.ENTREGUE, STATUS_ENTREGA.CANCELADA];

export class EntregasService {
  constructor(entregasRepository) {
    this.entregasRepository = entregasRepository;
  }

  criar(dados) {
    const { descricao, origem, destino } = validarDadosDeCriacao(dados);

    if (this.existeEntregaAtivaIgual(descricao, origem, destino)) {
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

  listar(statusDesejado) {
    const entregas = this.entregasRepository.listarTodas();

    if (statusDesejado === undefined) return entregas;

    if (!Object.hasOwn(STATUS_ENTREGA, statusDesejado)) {
      throw new ErroHttp(400, `status inválido: ${statusDesejado}`);
    }

    return entregas.filter((entrega) => entrega.status === statusDesejado);
  }

  buscarPorId(id) {
    const entrega = this.entregasRepository.buscarPorId(validarId(id));

    if (!entrega) throw new ErroHttp(404, 'entrega não encontrada');

    return entrega;
  }

  listarHistorico(id) {
    return this.buscarPorId(id).historico;
  }

  avancar(id) {
    const entrega = this.buscarPorId(id);
    const proximoStatus = PROXIMO_STATUS[entrega.status];

    if (!proximoStatus) {
      throw new ErroHttp(422, `não é possível avançar uma entrega ${entrega.status}`);
    }

    return this.mudarStatus(entrega, proximoStatus);
  }

  cancelar(id) {
    const entrega = this.buscarPorId(id);

    if (STATUS_FINAIS.includes(entrega.status)) {
      throw new ErroHttp(422, `não é possível cancelar uma entrega ${entrega.status}`);
    }

    return this.mudarStatus(entrega, STATUS_ENTREGA.CANCELADA);
  }

  mudarStatus(entrega, novoStatus) {
    return this.entregasRepository.atualizar(entrega.id, {
      status: novoStatus,
      historico: [...entrega.historico, criarEvento(`Status alterado para ${novoStatus}`)],
    });
  }

  existeEntregaAtivaIgual(descricao, origem, destino) {
    return this.entregasRepository.listarTodas().some(
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
