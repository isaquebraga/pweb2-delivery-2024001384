export function exporMensagens(req, res, next) {
  res.locals.sucessos = req.flash('sucesso');
  res.locals.falhas = req.flash('erro');
  res.locals.caminho = req.path;
  next();
}
