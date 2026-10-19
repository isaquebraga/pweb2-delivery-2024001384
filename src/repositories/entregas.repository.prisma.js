// Traz o histórico junto com a entrega, do evento mais antigo para o mais recente.
const COM_HISTORICO = {
  historico: {
    select: { data: true, descricao: true },
    orderBy: { id: 'asc' },
  },
};

// Código do Prisma para "o registro que você quer alterar não existe".
const REGISTRO_NAO_ENCONTRADO = 'P2025';

/** @implements {import('./contratos.js').IEntregasRepository} */
export class EntregasRepositoryPrisma {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  async listarTodos(filtros = {}) {
    const { status, motoristaId } = filtros;

    const entregas = await this.prisma.entrega.findMany({
      where: { status, motoristaId },
      include: COM_HISTORICO,
      orderBy: { id: 'asc' },
    });

    return entregas.map(paraEntrega);
  }

  async buscarPorId(id) {
    const entrega = await this.prisma.entrega.findUnique({
      where: { id },
      include: COM_HISTORICO,
    });

    return entrega && paraEntrega(entrega);
  }

  async criar(dados) {
    const { historico, ...campos } = dados;

    const entrega = await this.prisma.entrega.create({
      data: { ...campos, historico: { create: historico } },
      include: COM_HISTORICO,
    });

    return paraEntrega(entrega);
  }

  async atualizar(id, dados) {
    const { historico, ...campos } = dados;

    try {
      const entrega = await this.prisma.entrega.update({
        where: { id },
        data: {
          ...campos,
          // o contrato recebe o histórico inteiro: os eventos antigos dão lugar à lista nova
          historico: historico && { deleteMany: {}, create: historico },
        },
        include: COM_HISTORICO,
      });

      return paraEntrega(entrega);
    } catch (erro) {
      if (erro.code === REGISTRO_NAO_ENCONTRADO) return null;
      throw erro;
    }
  }
}

// O banco devolve a data do evento como Date; o contrato promete uma string ISO.
function paraEntrega(entrega) {
  return {
    ...entrega,
    historico: entrega.historico.map((evento) => ({
      data: evento.data.toISOString(),
      descricao: evento.descricao,
    })),
  };
}
