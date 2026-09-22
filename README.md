# Delivery Tracker API

API REST para rastrear o ciclo de vida de entregas, feita com **Node + Express** e
**arquitetura em camadas**. A persistência é simulada em memória — sem banco real e sem ORM.

> **Programação Web II** — IFAL/Maceió · Capítulo 4 · **Atividade 05**.
> Nesta etapa o foco é a entidade **Entrega**. Motoristas ficam para a Atividade 06.

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

As **10 checagens de Entregas passam (82/82)**. As 5 de Motoristas são da Atividade 06
e por isso ainda aparecem vermelhas.

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
├── repositories/         só acesso a dados
├── database/             persistência simulada em memória
└── utils/                erro com status HTTP + resposta padrão de erro
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
| **Service**    | validar, aplicar regras, orquestrar o repositório     | falar de `req`/`res`     |
| **Repository** | ler e gravar dados                                    | decidir regra de negócio |

Nenhuma camada dá `new` em ninguém: todas recebem a dependência pronta pelo
construtor. A composição acontece num **ponto único**, em `src/routes/index.js`:

```js
const banco = criarBancoEmMemoria();
const entregasRepository = new EntregasRepository(banco);
const entregasService = new EntregasService(entregasRepository);
const entregasController = new EntregasController(entregasService);
```

Como o Service só usa os quatro métodos do repositório (`listarTodas`, `buscarPorId`,
`criar`, `atualizar`), trocar a implementação por um Mock ou por um banco real exige
mudar apenas a linha do `entregasRepository` acima.

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
| `motoristaId` | `number \| null` | `null` ao criar (usado na Atividade 06)               |
| `historico`   | `Evento[]`       | eventos do mais antigo para o mais recente            |

### Evento

| Campo       | Tipo     | Observação                  |
| ----------- | -------- | --------------------------- |
| `data`      | `string` | data/hora do evento, em ISO |
| `descricao` | `string` | o que aconteceu             |

## Regras de negócio

- **Criação** — `origem` ≠ `destino` (senão `400`); status inicial `CRIADA`; já nasce
  com o primeiro evento no histórico.
- **Duplicidade** — proibida entrega **ativa** (nem `ENTREGUE` nem `CANCELADA`) com a
  mesma `descricao` + `origem` + `destino` → `409`.
- **Transições** — apenas `CRIADA` → `EM_TRANSITO` → `ENTREGUE`; qualquer outro avanço → `422`.
- **Cancelamento** — permitido só se o status não for `ENTREGUE` nem `CANCELADA` (senão `422`).

Toda mudança de status registra um novo evento no histórico.

---

## Rotas

Base `/api` · formato JSON · erros sempre como `{ "erro": "mensagem" }`.

| Método  | Rota                          | Sucesso                     | Erros                                                    |
| ------- | ----------------------------- | --------------------------- | -------------------------------------------------------- |
| `GET`   | `/api/health`                 | `200` `{ "status": "ok" }`  | —                                                        |
| `POST`  | `/api/entregas`               | `201` entrega criada        | `400` campos / origem == destino · `409` duplicata ativa |
| `GET`   | `/api/entregas`               | `200` array                 | —                                                        |
| `GET`   | `/api/entregas?status=CRIADA` | `200` array filtrado        | `400` status inválido                                    |
| `GET`   | `/api/entregas/:id`           | `200` entrega               | `404`                                                    |
| `PATCH` | `/api/entregas/:id/avancar`   | `200` entrega (novo status) | `404` · `422` transição inválida                         |
| `PATCH` | `/api/entregas/:id/cancelar`  | `200` entrega (`CANCELADA`) | `404` · `422` já `ENTREGUE`/`CANCELADA`                  |
| `GET`   | `/api/entregas/:id/historico` | `200` array de eventos      | `404`                                                    |

### Códigos de status

| Código | Quando                                                   |
| ------ | -------------------------------------------------------- |
| `200`  | sucesso em `GET`/`PATCH` que retorna recurso             |
| `201`  | `POST` que cria recurso                                  |
| `400`  | entrada inválida (campo faltando, `origem` == `destino`) |
| `404`  | recurso não encontrado                                   |
| `409`  | conflito de unicidade (duplicata ativa)                  |
| `422`  | violação de regra de estado (transição inválida)         |

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
```

---

> Os dados ficam em memória: ao reiniciar o servidor, a lista volta vazia.
