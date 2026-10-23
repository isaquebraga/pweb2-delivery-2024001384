import path from 'node:path';
import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import flash from 'connect-flash';
import methodOverride from 'method-override';

import { criarRotas } from './src/routes/index.js';
import { exporMensagens } from './src/middlewares/mensagens.js';

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(import.meta.dirname, 'src', 'views'));
app.set('layout', 'layouts/base');
app.use(expressLayouts);

app.use(express.static(path.join(import.meta.dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'delivery-tracker',
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(flash());
app.use(exporMensagens);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', criarRotas());

app.use((req, res) => res.status(404).json({ erro: 'recurso não encontrado' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Delivery Tracker rodando em http://localhost:${PORT}`));
