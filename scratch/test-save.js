const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(process.cwd(), 'data.json');

const getDB = () => {
  const fileData = fs.readFileSync(dataFilePath, 'utf-8');
  let data = JSON.parse(fileData);
  if (Array.isArray(data)) {
    return { projetos: data, relatorios: [] };
  }
  return data;
};

const saveFullDB = (db) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(db, null, 2));
};

const db = getDB();
db.relatorios.push({ id: "TESTE", nome: "Relatório de Teste" });
saveFullDB(db);
console.log("DB Salvo com sucesso. Formato atual:", Array.isArray(db) ? "Array" : "Objeto");
