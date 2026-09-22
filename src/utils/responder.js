import { ErroHttp } from './erro-http.js';

export function responderErro(res, erro) {
  if (erro instanceof ErroHttp) {
    return res.status(erro.status).json({ erro: erro.message });
  }

  console.error(erro);
  return res.status(500).json({ erro: 'erro interno do servidor' });
}
