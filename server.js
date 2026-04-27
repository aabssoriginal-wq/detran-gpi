const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Em modo standalone, o Next.js cria uma pasta .next/standalone
// Para App Service, podemos rodar o server.js que ele gera lá dentro
// Ou rodar o servidor padrão se o standalone não estiver disponível.

const port = process.env.PORT || 8080;

try {
  // Tenta carregar o servidor standalone (gerado pelo build)
  console.log('Iniciando servidor em modo standalone...');
  require('./.next/standalone/server.js');
} catch (e) {
  console.log('Standalone não encontrado, tentando modo padrão...');
  const app = next({ dev: false });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
    });
  });
}
