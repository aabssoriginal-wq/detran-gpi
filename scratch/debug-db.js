const fs = require('fs');
const path = require('path');

const isAzure = process.env.WEBSITE_INSTANCE_ID !== undefined;
let dataFilePath;

if (isAzure) {
  dataFilePath = '/home/site/data/data.json';
} else {
  dataFilePath = path.join(process.cwd(), 'data.json');
}

console.log("Caminho do Banco de Dados:", dataFilePath);
if (fs.existsSync(dataFilePath)) {
    const content = fs.readFileSync(dataFilePath, 'utf-8');
    const db = JSON.parse(content);
    console.log("É Array?", Array.isArray(db));
    if (!Array.isArray(db)) {
        console.log("Quantidade de Relatórios:", db.relatorios ? db.relatorios.length : 0);
        if (db.relatorios && db.relatorios.length > 0) {
            console.log("Último Relatório:", db.relatorios[0].nome);
        }
    }
} else {
    console.log("ARQUIVO NÃO ENCONTRADO!");
}
