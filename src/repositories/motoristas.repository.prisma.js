/** @implements {import('./contratos.js').IMotoristasRepository} */
export class MotoristasRepositoryPrisma {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  async listarTodos() {
    return this.prisma.motorista.findMany({ orderBy: { id: 'asc' } });
  }

  async buscarPorId(id) {
    return this.prisma.motorista.findUnique({ where: { id } });
  }

  async buscarPorCpf(cpf) {
    return this.prisma.motorista.findUnique({ where: { cpf } });
  }

  async criar(dados) {
    return this.prisma.motorista.create({ data: dados });
  }
}
