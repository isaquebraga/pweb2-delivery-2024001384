/** @implements {import('./contratos.js').IMotoristasRepository} */
export class MotoristasRepository {
  constructor(banco) {
    this.banco = banco;
  }

  listarTodos() {
    return [...this.banco.motoristas];
  }

  buscarPorId(id) {
    return this.banco.motoristas.find((motorista) => motorista.id === id) ?? null;
  }

  buscarPorCpf(cpf) {
    return this.banco.motoristas.find((motorista) => motorista.cpf === cpf) ?? null;
  }

  criar(dados) {
    const motorista = { id: this.banco.proximoIdDeMotorista, ...dados };

    this.banco.proximoIdDeMotorista += 1;
    this.banco.motoristas.push(motorista);

    return motorista;
  }
}
