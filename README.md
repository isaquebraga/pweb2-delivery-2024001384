# Delivery Tracker API

API REST para rastrear o ciclo de vida de entregas e os motoristas que as realizam,
feita com **Node + Express** e **arquitetura em camadas**. Os dados ficam num banco
**SQLite**, acessado pelo **Prisma ORM** — sobrevivem a reinícios do servidor.

> **Programação Web II** — IFAL/Maceió · Capítulo 5 · **Atividade 07**.
> Nesta etapa a persistência em memória dá lugar ao **Prisma + SQLite**, com
> **migrations versionadas** — sem mudar o comportamento da API.

---

## Requisitos

- **Node 18+** (o autograder usa o `fetch` global)
- npm

## Como executar

```bash
npm install                  # instala e gera o Prisma Client (postinstall)
cp .env.example .env         # DATABASE_URL="file:./dev.db"
npx prisma migrate dev       # cria o banco e aplica as migrations
npm start
```

A API sobe em <http://localhost:3000> e respeita a variável `PORT`:

```bash
PORT=8080 npm start     # http://localhost:8080
npm run dev             # com reload automático
```

### Banco de dados

O banco é configurado pela variável `DATABASE_URL` (veja `.env.example`). O caminho
`file:./dev.db` é relativo ao `schema.prisma`, então o arquivo fica em `prisma/dev.db` —
fora do git, assim como o `.env`.

| Comando                     | Atalho               | Para quê                                                    |
| --------------------------- | -------------------- | ----------------------------------------------------------- |
| `npx prisma migrate dev`    | `npm run db:migrate` | desenvolvimento: aplica as migrations (e cria novas se o schema mudou) |
| `npx prisma migrate deploy` | `npm run db:deploy`  | CI/produção: só aplica as migrations já versionadas         |
| `npx prisma studio`         | `npm run db:studio`  | abre uma interface web para ver e editar os dados           |
| `npx prisma generate`       | —                    | regera o Prisma Client (já roda sozinho no `npm install`)   |

Para conferir que os dados persistem: crie uma entrega, pare o servidor (`Ctrl+C`),
suba de novo e busque a entrega pelo id — ela continua lá.

### Rodando o autograder

Com o servidor no ar, em outro terminal:

```bash
npm run check           # = BASE_URL=http://localhost:3000 node autograder/check.mjs
```

As **15 checagens passam (122/122)**: 10 de Entregas e 5 de Motoristas — as mesmas
da Atividade 06, porque o contrato da API não mudou. No GitHub Actions o workflow roda
`prisma migrate deploy` antes de subir o servidor.

---

## Estrutura do projeto

```
server.js                 configura o Express e monta a API em /api
autograder/               correção automática (vem do repositório-modelo)
enunciados/               enunciados das atividades em PDF
prisma/
├── schema.prisma         modelos Entrega, Motorista e Evento (datasource SQLite)
└── migrations/           migrations versionadas (SQL gerado pelo Prisma)
src/
├── config/               singleton do Prisma Client (database.js)
├── routes/               composition root: injeta as dependências
├── controllers/          traduz HTTP <-> service (sem regra de negócio)
├── services/             TODA a regra de negócio
├── repositories/         só acesso a dados + contratos (contratos.js)
│                         *.repository.prisma.js → banco · *.repository.js → memória
├── database/             persistência em memória (implementação alternativa)
└── utils/                erro com status HTTP, resposta de erro, status e validações
```

## Arquitetura em camadas

Cada requisição atravessa as camadas sempre na mesma direção, e cada camada só
conhece a de baixo:

```
requisição → routes → controller → service → repository → Prisma Client → SQLite
```

O Prisma Client só aparece na camada de repository (e no composition root, que o
entrega pronto). Services e controllers não sabem que existe banco.

| Camada         | Pode                                                  | Não pode                 |
| -------------- | ----------------------------------------------------- | ------------------------ |
| **Controller** | ler a requisição, chamar o service, montar a resposta | decidir regra de negócio |
| **Service**    | validar, aplicar regras, orquestrar os repositories   | falar de `req`/`res`     |
| **Repository** | ler e gravar dados                                    | decidir regra de negócio |

## Contratos de Repository

Cada repository expõe um contrato explícito, documentado em JSDoc em
`src/repositories/contratos.js`. Os services dependem **só do contrato**, nunca da
implementação concreta. Todo método é **assíncrono** (devolve uma `Promise`), porque
ir ao banco leva tempo.

```
IEntregasRepository
  listarTodos(filtros?)  → Promise<Entrega[]>          filtros: { status?, motoristaId? }
  buscarPorId(id)        → Promise<Entrega | null>
  criar(dados)           → Promise<Entrega>
  atualizar(id, dados)   → Promise<Entrega | null>

IMotoristasRepository
  listarTodos()          → Promise<Motorista[]>
  buscarPorId(id)        → Promise<Motorista | null>
  buscarPorCpf(cpf)      → Promise<Motorista | null>
  criar(dados)           → Promise<Motorista>
```

Cada contrato tem **duas implementações**, intercambiáveis:

| Contrato                | Banco (em uso)               | Memória                |
| ----------------------- | ---------------------------- | ---------------------- |
| `IEntregasRepository`   | `EntregasRepositoryPrisma`   | `EntregasRepository`   |
| `IMotoristasRepository` | `MotoristasRepositoryPrisma` | `MotoristasRepository` |

O repository Prisma devolve os dados no **mesmo formato** do de memória: a entrega
vem com `historico` como array de `{ data, descricao }` (a `data` em ISO), do evento
mais antigo para o mais recente.

## Composição das dependências

Nenhuma camada dá `new` em ninguém: todas recebem a dependência pronta pelo
construtor. A composição acontece num **ponto único**, em `src/routes/index.js`:

```js
const entregasRepository = new EntregasRepositoryPrisma(prisma);
const motoristasRepository = new MotoristasRepositoryPrisma(prisma);

const entregasService = new EntregasService(entregasRepository, motoristasRepository);
const motoristasService = new MotoristasService(motoristasRepository, entregasRepository);

const entregasController = new EntregasController(entregasService);
const motoristasController = new MotoristasController(motoristasService);
```

```
prisma (singleton)
        │
        ├──► EntregasRepositoryPrisma ─────┬──► EntregasService ────► EntregasController ────► /api/entregas
        │                                  └──► MotoristasService
        │
        └──► MotoristasRepositoryPrisma ───┬──► MotoristasService ──► MotoristasController ──► /api/motoristas
                                           └──► EntregasService
```

Cada service recebe os **dois** repositories: o `EntregasService` consulta o motorista
na hora de atribuir, e o `MotoristasService` consulta as entregas de um motorista.

Trocar a persistência é trocar **uma linha por repository** aqui. Para voltar à
memória, por exemplo:

```js
const banco = criarBancoEmMemoria();
const entregasRepository = new EntregasRepository(banco);
const motoristasRepository = new MotoristasRepository(banco);
```

---

## Modelo de domínio

No banco (`prisma/schema.prisma`) são três tabelas: `motoristas`, `entregas` e
`eventos`. O histórico de uma entrega são as linhas de `eventos` ligadas a ela
(relação 1:N, apagadas junto com a entrega). O `cpf` é `@unique` no schema e os status
são `enum` do Prisma.

```
motoristas 1 ──── N entregas 1 ──── N eventos
  (id)          (motoristaId?)        (entregaId)
```

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

> Os dados ficam no SQLite (`prisma/dev.db`): ao reiniciar o servidor, tudo continua lá.
> Para começar do zero: `npx prisma migrate reset`.
