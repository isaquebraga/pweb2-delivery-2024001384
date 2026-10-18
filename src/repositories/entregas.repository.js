/** @implements {import('./contratos.js').IEntregasRepository} */
export class EntregasRepository {
  constructor(banco) {
    this.banco = banco;
  }

  async listarTodos(filtros = {}) {
    const { status, motoristaId } = filtros;

    return this.banco.entregas.filter(
      (entrega) =>
        (status === undefined || entrega.status === status) &&
        (motoristaId === undefined || entrega.motoristaId === motoristaId),
    );
  }

  async buscarPorId(id) {
    return this.banco.entregas.find((entrega) => entrega.id === id) ?? null;
  }

  async criar(dados) {
    const entrega = { id: this.banco.proximoIdDeEntrega, ...dados };

    this.banco.proximoIdDeEntrega += 1;
    this.banco.entregas.push(entrega);

    return entrega;
  }

  async atualizar(id, dados) {
    const posicao = this.banco.entregas.findIndex((entrega) => entrega.id === id);
    if (posicao === -1) return null;

    this.banco.entregas[posicao] = { ...this.banco.entregas[posicao], ...dados };
    return this.banco.entregas[posicao];
  }
}
