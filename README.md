# Delivery Tracker API

API REST para rastrear o ciclo de vida de entregas e os motoristas que as realizam,
feita com **Node + Express** e **arquitetura em camadas**. A persistência é simulada
em memória — sem banco real e sem ORM.

> **Programação Web II** — IFAL/Maceió · Capítulo 4 · **Atividade 06**.
> Nesta etapa entram os **Motoristas**, os **contratos de Repository** e a
> **injeção de dependência** entre múltiplos repositories.

---

## Requisitos

- **Node 18+** (o autograder usa o `fetch` global)
- npm

## Como executar

```bash
npm install
npm start
```

A API sobe em <http://localhost:3000> e respeita a variável `PORT`:

```bash
PORT=8080 npm start     # http://localhost:8080
npm run dev             # com reload automático
```

### Rodando o autograder

Com o servidor no ar, em outro terminal:

```bash
npm run check           # = BASE_URL=http://localhost:3000 node autograder/check.mjs
```

As **15 checagens passam (122/122)**: 10 de Entregas e 5 de Motoristas.

---

## Estrutura do projeto

```
server.js                 configura o Express e monta a API em /api
autograder/               correção automática (vem do repositório-modelo)
enunciados/               enunciados das atividades em PDF
src/
├── routes/               composition root: injeta as dependências
├── controllers/          traduz HTTP <-> service (sem regra de negócio)
├── services/             TODA a regra de negócio
├── repositories/         só acesso a dados + contratos (contratos.js)
├── database/             persistência simulada em memória
└── utils/                erro com status HTTP, resposta de erro, status e validações
```

## Arquitetura em camadas

Cada requisição atravessa as camadas sempre na mesma direção, e cada camada só
conhece a de baixo:

```
requisição → routes → controller → service → repository → database
```

| Camada         | Pode                                                  | Não pode                 |
| -------------- | ----------------------------------------------------- | ------------------------ |
| **Controller** | ler a requisição, chamar o service, montar a resposta | decidir regra de negócio |
| **Service**    | validar, aplicar regras, orquestrar os repositories   | falar de `req`/`res`     |
| **Repository** | ler e gravar dados                                    | decidir regra de negócio |

## Contratos de Repository

Cada repository expõe um contrato explícito, documentado em JSDoc em
`src/repositories/contratos.js`. Os services dependem **só do contrato**, nunca da
implementação concreta.

```
IEntregasRepository
  listarTodos(filtros?)  → Entrega[]          filtros: { status?, motoristaId? }
  buscarPorId(id)        → Entrega | null
  criar(dados)           → Entrega
  atualizar(id, dados)   → Entrega

IMotoristasRepository
  listarTodos()          → Motorista[]
  buscarPorId(id)        → Motorista | null
  buscarPorCpf(cpf)      → Motorista | null
  criar(dados)           → Motorista
```

Como os services só chamam esses métodos, qualquer objeto que respeite o contrato
(um Mock ou um repository de banco real) pode substituir a implementação em memória
sem que os services mudem.

## Composição das dependências

Nenhuma camada dá `new` em ninguém: todas recebem a dependência pronta pelo
construtor. A composição acontece num **ponto único**, em `src/routes/index.js`:

```js
const banco = criarBancoEmMemoria();

const entregasRepository = new EntregasRepository(banco);
const motoristasRepository = new MotoristasRepository(banco);

const entregasService = new EntregasService(entregasRepository, motoristasRepository);
const motoristasService = new MotoristasService(motoristasRepository, entregasRepository);

const entregasController = new EntregasController(entregasService);
const motoristasController = new MotoristasController(motoristasService);
```

```
criarBancoEmMemoria()
        │
        ├──► EntregasRepository ─────┬──► EntregasService ────► EntregasController ────► /api/entregas
        │                            └──► MotoristasService
        │
        └──► MotoristasRepository ───┬──► MotoristasService ──► MotoristasController ──► /api/motoristas
                                     └──► EntregasService
```

Cada service recebe os **dois** repositories: o `EntregasService` consulta o motorista
na hora de atribuir, e o `MotoristasService` consulta as entregas de um motorista.

---

## Modelo de domínio

### Entrega

| Campo         | Tipo             | Observação                                            |
| ------------- | ---------------- | ----------------------------------------------------- |
| `id`          | `number`         | gerado automaticamente                                |
| `descricao`   | `string`         | obrigatório                                           |
| `origem`      | `string`         | obrigatório; ≠ `destino`                              |
| `destino`     | `string`         | obrigatório                                           |
| `status`      | `enum`           | `CRIADA` → `EM_TRANSITO` → `ENTREGUE`; ou `CANCELADA` |
| `motoristaId` | `number \| null` | `null` ao criar; preenchido na atribuição             |
| `historico`   | `Evento[]`       | eventos do mais antigo para o mais recente            |

### Evento

| Campo       | Tipo     | Observação                  |
| ----------- | -------- | --------------------------- |
| `data`      | `string` | data/hora do evento, em ISO |
| `descricao` | `string` | o que aconteceu             |

### Motorista

| Campo          | Tipo             | Observação                   |
| -------------- | ---------------- | ---------------------------- |
| `id`           | `number`         | gerado automaticamente       |
| `nome`         | `string`         | obrigatório                  |
| `cpf`          | `string`         | obrigatório; **único**       |
| `placaVeiculo` | `string \| null` | opcional                     |
| `status`       | `enum`           | `ATIVO` (padrão) · `INATIVO` |

## Regras de negócio

### Entregas

- **Criação** — `origem` ≠ `destino` (senão `400`); status inicial `CRIADA`; já nasce
  com o primeiro evento no histórico.
- **Duplicidade** — proibida entrega **ativa** (nem `ENTREGUE` nem `CANCELADA`) com a
  mesma `descricao` + `origem` + `destino` → `409`.
- **Transições** — apenas `CRIADA` → `EM_TRANSITO` → `ENTREGUE`; qualquer outro avanço → `422`.
- **Cancelamento** — permitido só se o status não for `ENTREGUE` nem `CANCELADA` (senão `422`).
- **Atribuição** — só se a entrega estiver `CRIADA` e o motorista estiver `ATIVO`
  (senão `422`); grava o `motoristaId` e registra um evento no histórico.

Toda mudança de status registra um novo evento no histórico.

### Motoristas

- **Cadastro** — `nome` e `cpf` obrigatórios (senão `400`); status inicial `ATIVO`.
- **Unicidade** — proibido cadastrar um `cpf` que já existe → `409`.

---

## Rotas

Base `/api` · formato JSON · erros sempre como `{ "erro": "mensagem" }`.

### Entregas

| Método  | Rota                          | Sucesso                           | Erros                                                     |
| ------- | ----------------------------- | --------------------------------- | --------------------------------------------------------- |
| `GET`   | `/api/health`                 | `200` `{ "status": "ok" }`        | —                                                         |
| `POST`  | `/api/entregas`               | `201` entrega criada              | `400` campos / origem == destino · `409` duplicata ativa  |
| `GET`   | `/api/entregas`               | `200` array                       | —                                                         |
| `GET`   | `/api/entregas?status=CRIADA` | `200` array filtrado              | `400` status inválido                                     |
| `GET`   | `/api/entregas/:id`           | `200` entrega                     | `404`                                                     |
| `PATCH` | `/api/entregas/:id/avancar`   | `200` entrega (novo status)       | `404` · `422` transição inválida                          |
| `PATCH` | `/api/entregas/:id/cancelar`  | `200` entrega (`CANCELADA`)       | `404` · `422` já `ENTREGUE`/`CANCELADA`                   |
| `PATCH` | `/api/entregas/:id/atribuir`  | `200` entrega (com `motoristaId`) | `404` · `422` entrega não-`CRIADA` ou motorista `INATIVO` |
| `GET`   | `/api/entregas/:id/historico` | `200` array de eventos            | `404`                                                     |

### Motoristas

| Método | Rota                                         | Sucesso                           | Erros                              |
| ------ | -------------------------------------------- | --------------------------------- | ---------------------------------- |
| `POST` | `/api/motoristas`                            | `201` motorista (status `ATIVO`)  | `400` campos · `409` CPF duplicado |
| `GET`  | `/api/motoristas`                            | `200` array                       | —                                  |
| `GET`  | `/api/motoristas/:id`                        | `200` motorista                   | `404`                              |
| `GET`  | `/api/motoristas/:id/entregas`               | `200` só as entregas do motorista | `404`                              |
| `GET`  | `/api/motoristas/:id/entregas?status=CRIADA` | `200` filtro combinado            | `400` status inválido · `404`      |

### Códigos de status

| Código | Quando                                                         |
| ------ | -------------------------------------------------------------- |
| `200`  | sucesso em `GET`/`PATCH` que retorna recurso                   |
| `201`  | `POST` que cria recurso                                        |
| `400`  | entrada inválida (campo faltando, `origem` == `destino`)       |
| `404`  | recurso não encontrado                                         |
| `409`  | conflito de unicidade (duplicata ativa, CPF duplicado)         |
| `422`  | violação de regra de estado (transição ou atribuição inválida) |

---

## Exemplos de requisição (curl)

**Health check**

```bash
curl http://localhost:3000/api/health
# {"status":"ok"}
```

**Criar uma entrega**

```bash
curl -X POST http://localhost:3000/api/entregas \
  -H "Content-Type: application/json" \
  -d '{"descricao":"Notebook","origem":"Maceió","destino":"Recife"}'
```

```json
{
  "id": 1,
  "descricao": "Notebook",
  "origem": "Maceió",
  "destino": "Recife",
  "status": "CRIADA",
  "motoristaId": null,
  "historico": [
    { "data": "2026-09-22T20:12:36.104Z", "descricao": "Entrega criada com status CRIADA" }
  ]
}
```

**Listar todas e filtrar por status**

```bash
curl http://localhost:3000/api/entregas
curl "http://localhost:3000/api/entregas?status=CRIADA"
```

**Buscar uma entrega pelo id**

```bash
curl http://localhost:3000/api/entregas/1
```

**Avançar o status** (`CRIADA` → `EM_TRANSITO` → `ENTREGUE`)

```bash
curl -X PATCH http://localhost:3000/api/entregas/1/avancar
```

**Cancelar**

```bash
curl -X PATCH http://localhost:3000/api/entregas/1/cancelar
```

**Ver o histórico**

```bash
curl http://localhost:3000/api/entregas/1/historico
```

```json
[
  { "data": "2026-09-22T20:12:36.104Z", "descricao": "Entrega criada com status CRIADA" },
  { "data": "2026-09-22T20:13:01.882Z", "descricao": "Status alterado para EM_TRANSITO" }
]
```

**Cadastrar um motorista** (`placaVeiculo` é opcional)

```bash
curl -X POST http://localhost:3000/api/motoristas \
  -H "Content-Type: application/json" \
  -d '{"nome":"João","cpf":"123.456.789-00","placaVeiculo":"ABC1D23"}'
```

```json
{
  "id": 1,
  "nome": "João",
  "cpf": "123.456.789-00",
  "placaVeiculo": "ABC1D23",
  "status": "ATIVO"
}
```

**Listar motoristas e buscar pelo id**

```bash
curl http://localhost:3000/api/motoristas
curl http://localhost:3000/api/motoristas/1
```

**Atribuir um motorista a uma entrega**

```bash
curl -X PATCH http://localhost:3000/api/entregas/1/atribuir \
  -H "Content-Type: application/json" \
  -d '{"motoristaId":1}'
```

```json
{
  "id": 1,
  "descricao": "Notebook",
  "origem": "Maceió",
  "destino": "Recife",
  "status": "CRIADA",
  "motoristaId": 1,
  "historico": [
    { "data": "2026-09-30T10:41:12.306Z", "descricao": "Entrega criada com status CRIADA" },
    { "data": "2026-09-30T10:42:05.771Z", "descricao": "Entrega atribuída ao motorista João" }
  ]
}
```

**Entregas de um motorista** (com ou sem filtro de status)

```bash
curl http://localhost:3000/api/motoristas/1/entregas
curl "http://localhost:3000/api/motoristas/1/entregas?status=CRIADA"
```

### Exemplos de erro

```bash
# 400 — origem igual ao destino
curl -X POST http://localhost:3000/api/entregas \
  -H "Content-Type: application/json" \
  -d '{"descricao":"Teste","origem":"Recife","destino":"Recife"}'
# {"erro":"origem e destino devem ser diferentes"}

# 404 — entrega inexistente
curl http://localhost:3000/api/entregas/99999
# {"erro":"entrega não encontrada"}

# 422 — avançar uma entrega já ENTREGUE
curl -X PATCH http://localhost:3000/api/entregas/1/avancar
# {"erro":"não é possível avançar uma entrega ENTREGUE"}

# 409 — CPF já cadastrado
curl -X POST http://localhost:3000/api/motoristas \
  -H "Content-Type: application/json" \
  -d '{"nome":"Outro João","cpf":"123.456.789-00"}'
# {"erro":"já existe um motorista cadastrado com o cpf 123.456.789-00"}

# 422 — atribuir motorista a uma entrega que não está CRIADA
curl -X PATCH http://localhost:3000/api/entregas/1/atribuir \
  -H "Content-Type: application/json" \
  -d '{"motoristaId":1}'
# {"erro":"não é possível atribuir motorista a uma entrega EM_TRANSITO"}
```

---

> Os dados ficam em memória: ao reiniciar o servidor, a lista volta vazia.
