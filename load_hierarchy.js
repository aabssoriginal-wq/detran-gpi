const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(process.cwd(), 'data.json');
let projetos = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

const rawData = `1000	Projeto	CNH Paulista		DTI	Amanda Guedes Gomes				
1001	Tarefa	01 – DMND0001337 – #265064 – Res. 1.020 | Ajuste na TR 151	1000	DTI	Amanda Guedes Gomes	17/12/2025	29/01/2026	100	Ajuste na TR 151
1002	Tarefa	02 – PRJ0011720 – DMND0001340 – Exame teórico sem matrícula CFC	1000	DTI	Amanda Guedes Gomes	15/12/2025	07/01/2026	100	Exame teórico
1003	Tarefa	05 – PRJ0014255 – DMND0001412 – CNH somente versão digital	1000	DTI	Amanda Guedes Gomes	23/12/2025	19/03/2026	50	Versão digital
2000	Projeto	RST (Registro de Sinistros de Trânsito)		DTI	Amanda Guedes Gomes				
2001	Tarefa	1- Dependências	2000	DTI	Amanda Guedes Gomes	23/01/2026	27/02/2026	100	Tratamento das dependências
2002	Subtarefa	Criação do Ambiente	2001	DTI	Amanda Guedes Gomes	26/01/2026	06/02/2026	100	Criação do ambiente Admin
2003	Subtarefa	Aprovação Protótipo Administração	2001	DTI	Amanda Guedes Gomes	23/01/2026	30/01/2026	100	Aprovação
2004	Tarefa	9- Protótipo - Administração - V2	2000	DTI	Amanda Guedes Gomes	05/02/2026	16/02/2026	100	Protótipo V2
2005	Tarefa	11- Desenvolvimento de BackEnd - Operacional	2000	DTI	Amanda Guedes Gomes	09/02/2026	04/03/2026	100	BackEnd Operacional
3000	Projeto	SEV - Vistorias		DTI	Amanda Guedes Gomes				
3001	Tarefa	Pagamento de 5 vistorias	3000	DTI	Amanda Guedes Gomes	02/02/2026	13/02/2026	100	Pagamento de 5 vistorias
3002	Subtarefa	12/02: em testes por QA	3001	DTI	Amanda Guedes Gomes	12/02/2026	13/02/2026	100	Testes QA
3003	Tarefa	15- Integração com Portal do Cidadão	3000	DTI	Amanda Guedes Gomes	17/11/2025	11/12/2025	100	Portal Cidadão
3004	Tarefa	11- Frontend (Plataforma Estadual de Vistoria)	3000	DTI	Amanda Guedes Gomes	17/11/2025	05/12/2025	100	Frontend eVistoria
4000	Projeto	Prova Prática		DTI	Amanda Guedes Gomes				
4001	Tarefa	16 - Desenvolvimento de BackEnd - Auxiliar	4000	DTI	Amanda Guedes Gomes	27/03/2026	10/04/2026	0	BackEnd Auxiliar
4002	Subtarefa	Login gov.br + Biometria Facial	4001	DTI	Amanda Guedes Gomes	30/03/2026	03/04/2026	100	Autenticação
4003	Tarefa	17 - Desenvolvimento de FrontEnd - Auxiliar	4000	DTI	Amanda Guedes Gomes	23/03/2026	03/04/2026	0	FrontEnd Auxiliar
4004	Tarefa	1 - Dependências	4000	DTI	Amanda Guedes Gomes	27/01/2026	30/03/2026	100	Dependências gerais
5000	Projeto	Normas SP		DTI	Amanda Guedes Gomes				
5001	Tarefa	48 - Lote 2: Leis (Massivo)	5000	DTI	Amanda Guedes Gomes	23/03/2026	01/05/2026	50	Job de processamento paralelo
5002	Tarefa	49 - Registro de Proveniência	5000	DTI	Amanda Guedes Gomes	15/05/2026	18/05/2026	0	Smart Contracts
5003	Tarefa	50 - Lote 3: Decretos	5000	DTI	Amanda Guedes Gomes	04/05/2026	15/05/2026	0	Preemptible VMs
5004	Tarefa	56 - Governança IBFT	5000	DTI	Amanda Guedes Gomes	23/02/2026	06/03/2026	100	Especificação do Genesis Block`;

const parseDate = (d) => {
  if (!d || d.trim() === "") return "";
  const parts = d.split('/');
  if (parts.length !== 3) return "";
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const lines = rawData.split('\n');
const items = lines.map(line => {
  const cols = line.split('\t');
  return {
    id: cols[0],
    tipo: cols[1],
    nome: cols[2].trim(),
    parentId: cols[3],
    dept: cols[4],
    resp: cols[5],
    inicio: parseDate(cols[6]),
    fim: parseDate(cols[7]),
    progress: parseInt(cols[8]) || 0,
    notas: cols[9]?.trim() || ""
  };
});

// 1. Separar Projetos
const novosProjetosRaw = items.filter(i => i.tipo === 'Projeto');
const novasTarefasRaw = items.filter(i => i.tipo !== 'Projeto');

novosProjetosRaw.forEach(pRaw => {
  const status = pRaw.progress === 100 ? "concluido" : (pRaw.progress > 0 ? "desenvolvimento" : "planejamento");
  
  const p = {
    id: parseInt(pRaw.id),
    nome: pRaw.nome,
    status: status,
    andamento: true,
    progress: pRaw.progress,
    delta: 0,
    text: status.charAt(0).toUpperCase() + status.slice(1),
    indicator: status === "concluido" ? "bg-emerald-600" : (status === "desenvolvimento" ? "bg-amber-500" : "bg-indigo-400"),
    icon: status === "concluido" ? "CheckCircle2" : "Clock",
    iconColor: status === "concluido" ? "text-emerald-600" : (status === "desenvolvimento" ? "text-amber-500" : "text-indigo-400"),
    responsavel: pRaw.resp,
    departamento: "Diretoria de Tecnologia da Informação",
    excluido: false,
    logs: [{ acao: "Carga de Projeto e EAP Hierárquica", data: "28/04/2026 16:05", justificativa: "Importação de planilha estruturada", user: "Sistema" }],
    baselineData: { inicio: pRaw.inicio, fim: pRaw.fim },
    tarefas: [],
    escopo: pRaw.notas
  };

  // Encontrar tarefas vinculadas a este projeto (direta ou indiretamente)
  const tarefasDoProjeto = [];
  
  const processRecursivo = (pid) => {
    const filhas = novasTarefasRaw.filter(t => t.parentId === pid);
    filhas.forEach(f => {
      tarefasDoProjeto.push({
        id: f.id,
        titulo: f.nome,
        status: f.progress === 100 ? "concluido" : "em_andamento",
        progress: f.progress,
        responsavel: f.resp,
        dataInicio: f.inicio,
        dataFim: f.fim,
        parentId: f.parentId === pRaw.id ? "" : f.parentId, // No DB local, parentId vazio significa que é raiz do projeto
        notas: f.notas
      });
      processRecursivo(f.id);
    });
  };

  processRecursivo(pRaw.id);
  p.tarefas = tarefasDoProjeto;
  
  // Substituir se já existir ou adicionar
  const idx = projetos.findIndex(x => x.id === p.id);
  if (idx !== -1) projetos[idx] = p;
  else projetos.unshift(p);
});

fs.writeFileSync(dataFilePath, JSON.stringify(projetos, null, 2));
console.log(`Carga de ${novosProjetosRaw.length} projetos e suas hierarquias concluída.`);
