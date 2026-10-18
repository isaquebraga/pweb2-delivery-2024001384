/** @implements {import('./contratos.js').IMotoristasRepository} */
export class MotoristasRepository {
  constructor(banco) {
    this.banco = banco;
  }

  async listarTodos() {
    return [...this.banco.motoristas];
  }

  async buscarPorId(id) {
    return this.banco.motoristas.find((motorista) => motorista.id === id) ?? null;
  }

  async buscarPorCpf(cpf) {
    return this.banco.motoristas.find((motorista) => motorista.cpf === cpf) ?? null;
  }

  async criar(dados) {
    const motorista = { id: this.banco.proximoIdDeMotorista, ...dados };

    this.banco.proximoIdDeMotorista += 1;
    this.banco.motoristas.push(motorista);

    return motorista;
  }
}
