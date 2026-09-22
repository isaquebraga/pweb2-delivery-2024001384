export class EntregasRepository {
  constructor(banco) {
    this.banco = banco;
  }

  listarTodas() {
    return [...this.banco.entregas];
  }

  buscarPorId(id) {
    return this.banco.entregas.find((entrega) => entrega.id === id) ?? null;
  }

  criar(dados) {
    const entrega = { id: this.banco.proximoIdDeEntrega, ...dados };

    this.banco.proximoIdDeEntrega += 1;
    this.banco.entregas.push(entrega);

    return entrega;
  }

  atualizar(id, dados) {
    const posicao = this.banco.entregas.findIndex((entrega) => entrega.id === id);
    if (posicao === -1) return null;

    this.banco.entregas[posicao] = { ...this.banco.entregas[posicao], ...dados };
    return this.banco.entregas[posicao];
  }
}
