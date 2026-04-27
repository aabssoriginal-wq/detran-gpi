
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(process.cwd(), 'data.json');

if (fs.existsSync(dataFilePath)) {
  const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
  
  const cleaned = data.map(proj => {
    // Se as datas são as default antigas, vamos limpar
    const default1 = { inicio: "2026-01-01", fim: "2026-12-31" };
    const default2 = { inicio: "2026-01-01", fim: "2027-01-01" };
    
    const isDefault = (proj.baselineData.inicio === default1.inicio && proj.baselineData.fim === default1.fim) ||
                      (proj.baselineData.inicio === default2.inicio && proj.baselineData.fim === default2.fim);
    
    if (isDefault) {
      // Se não tem tarefas, limpa. Se tem tarefas, deixa o getProjetos recalcular.
      return {
        ...proj,
        baselineData: { inicio: "", fim: "" }
      };
    }
    return proj;
  });
  
  fs.writeFileSync(dataFilePath, JSON.stringify(cleaned, null, 2));
  console.log("data.json cleaned.");
}
