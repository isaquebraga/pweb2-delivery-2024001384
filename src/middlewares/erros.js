import { ErroHttp } from '../utils/erro-http.js';

export function paginaNaoEncontrada(req, res) {
  res.status(404).render('erro', { status: 404, mensagem: 'página não encontrada' });
}

export function tratarErros(erro, req, res, next) {
  if (erro instanceof ErroHttp) {
    return res.status(erro.status).render('erro', { status: erro.status, mensagem: erro.message });
  }

  console.error(erro);
  res.status(500).render('erro', { status: 500, mensagem: 'erro interno do servidor' });
}
