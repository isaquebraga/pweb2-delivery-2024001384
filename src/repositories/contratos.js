/**
 * @typedef {Object} Evento
 * @property {string} data data/hora do evento, em ISO
 * @property {string} descricao o que aconteceu
 */

/**
 * @typedef {Object} Entrega
 * @property {number} id
 * @property {string} descricao
 * @property {string} origem
 * @property {string} destino
 * @property {'CRIADA' | 'EM_TRANSITO' | 'ENTREGUE' | 'CANCELADA'} status
 * @property {number | null} motoristaId
 * @property {Evento[]} historico
 */

/**
 * @typedef {Object} Motorista
 * @property {number} id
 * @property {string} nome
 * @property {string} cpf
 * @property {string | null} placaVeiculo
 * @property {'ATIVO' | 'INATIVO'} status
 */

/**
 * @typedef {Object} FiltrosDeEntrega
 * @property {string} [status] mantém só as entregas com esse status
 * @property {number} [motoristaId] mantém só as entregas desse motorista
 */

/**
 * Contrato de persistência de entregas.
 * Os services dependem apenas destes métodos, nunca da implementação concreta.
 *
 * @typedef {Object} IEntregasRepository
 * @property {(filtros?: FiltrosDeEntrega) => Entrega[]} listarTodos
 *   lista as entregas que atendem a todos os filtros informados; sem filtros, lista todas
 * @property {(id: number) => Entrega | null} buscarPorId
 *   busca a entrega pelo id; devolve null se ela não existir
 * @property {(dados: Omit<Entrega, 'id'>) => Entrega} criar
 *   grava uma nova entrega e devolve ela com o id gerado
 * @property {(id: number, dados: Partial<Entrega>) => Entrega | null} atualizar
 *   mescla os dados na entrega existente e devolve ela atualizada; null se ela não existir
 */

/**
 * Contrato de persistência de motoristas.
 * Os services dependem apenas destes métodos, nunca da implementação concreta.
 *
 * @typedef {Object} IMotoristasRepository
 * @property {() => Motorista[]} listarTodos
 *   lista todos os motoristas
 * @property {(id: number) => Motorista | null} buscarPorId
 *   busca o motorista pelo id; devolve null se ele não existir
 * @property {(cpf: string) => Motorista | null} buscarPorCpf
 *   busca o motorista pelo cpf; devolve null se ele não existir
 * @property {(dados: Omit<Motorista, 'id'>) => Motorista} criar
 *   grava um novo motorista e devolve ele com o id gerado
 */

export {};
