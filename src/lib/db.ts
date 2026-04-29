// GPI System DB Layer
import fs from 'fs';
import path from 'path';
import { formatarDataBR } from "./utils";

// No Azure, a raiz do site montada via Run From Package é somente leitura.
const getDBPath = () => {
  const isAzure = process.env.WEBSITE_INSTANCE_ID !== undefined;
  if (isAzure) {
    const azureDataDir = path.join('/home/site/data');
    
    // FORÇAR LIMPEZA SE SOLICITADO PELO DEPLOY
    if (process.env.FORCE_CLEAN === 'true') {
      try {
        if (fs.existsSync(azureDataDir)) {
          fs.rmSync(azureDataDir, { recursive: true, force: true });
        }
      } catch(e) {}
    }

    if (!fs.existsSync(azureDataDir)) {
      try { fs.mkdirSync(azureDataDir, { recursive: true }); } catch(e) {}
    }
    return path.join(azureDataDir, 'data.json');
  }
  return path.join(process.cwd(), 'data.json');
};

const getUsersPath = () => {
  const isAzure = process.env.WEBSITE_INSTANCE_ID !== undefined;
  if (isAzure) {
    const azureDataDir = path.join('/home/site/data');
    if (!fs.existsSync(azureDataDir)) {
      try { fs.mkdirSync(azureDataDir, { recursive: true }); } catch(e) {}
    }
    return path.join(azureDataDir, 'users.json');
  }
  return path.join(process.cwd(), 'users.json');
};

const dataFilePath = getDBPath();

export interface LogEntry {
  acao: string;
  data: string;
  justificativa: string;
  user: string;
}

export interface NotaTarefa {
  id: string;
  texto: string;
  data: string;
  user: string;
  arquivoUrl?: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  status: string;
  progress: number;
  responsavel?: string;
  dataInicio?: string;
  dataFim?: string;
  parentId?: string;
  notas?: string;
  lancamentos?: NotaTarefa[];
  impedimentoAtivo?: boolean;
  motivoImpedimento?: string;
  justificativaResolucao?: string;
  responsavelTecnico?: string;
}

export interface BaselineData {
  inicio: string;
  fim: string;
}

export interface Projeto {
  id: number;
  nome: string;
  status: string;
  andamento: boolean;
  progress: number;
  delta: number;
  text: string;
  indicator: string;
  icon: string;
  iconColor: string;
  responsavel?: string;
  departamento?: string;
  excluido: boolean;
  logs: LogEntry[];
  baselineData: BaselineData;
  tarefas: Tarefa[];
  escopo?: string;
  favoritos: string[];
}

export interface Relatorio {
  id: string;
  nome: string; 
  dataGeracao: string;
  autor: string;
  diretoria: string; // Governança por diretoria
  panorama: any[]; 
  detalhes: any[]; 
}

export interface DB {
  projetos: Projeto[];
  relatorios: Relatorio[];
}

const defaultBaseline = { inicio: "2026-01-01", fim: "2026-12-31" };

let cachedProjetos: Projeto[] | null = null;
let lastReadTime: number = 0;
const CACHE_TTL = 5000;

const initializeDB = () => {
  if (!fs.existsSync(dataFilePath)) {
    const initialData: DB = {
      projetos: [
        { id: 1, nome: "Identidade Digital (SSO)", status: "prazo", andamento: true, progress: 85, delta: 0, text: "No Prazo", indicator: "bg-emerald-500", icon: "CheckCircle2", iconColor: "text-emerald-500", responsavel: "Luiz Wanderley", departamento: "Diretoria de Tecnologia da Informação", excluido: false, logs: [], baselineData: { inicio: "2026-05-01", fim: "2026-12-15" }, tarefas: [], favoritos: [] },
        { id: 2, nome: "Migração para Azure Cloud", status: "atrasados", andamento: true, progress: 45, delta: 18, text: "Delta: +18 dias", indicator: "bg-rose-500", icon: "AlertCircle", iconColor: "text-rose-500", responsavel: "Equipe Infra", departamento: "Diretoria de Tecnologia da Informação", excluido: false, logs: [], baselineData: { inicio: "2026-03-01", fim: "2026-10-30" }, tarefas: [], favoritos: [] },
        { id: 3, nome: "Novo Portal do Cliente", status: "risco", andamento: true, progress: 30, delta: 5, text: "Delta: +5 dias", indicator: "bg-amber-500", icon: "Clock", iconColor: "text-amber-500", responsavel: "Equipe Front", departamento: "Diretoria de Tecnologia da Informação", excluido: false, logs: [], baselineData: { inicio: "2026-06-01", fim: "2026-11-20" }, tarefas: [], favoritos: [] }
      ],
      relatorios: []
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
  }
};

const getDB = (): DB => {
  initializeDB();
  const fileData = fs.readFileSync(dataFilePath, 'utf-8');
  let data = JSON.parse(fileData);
  if (Array.isArray(data)) {
    return { projetos: data, relatorios: [] };
  }
  return {
    projetos: data.projetos || [],
    relatorios: data.relatorios || []
  };
};

const saveDB = (projetos: Projeto[]) => {
  const db = getDB();
  db.projetos = projetos;
  fs.writeFileSync(dataFilePath, JSON.stringify(db, null, 2));
  cachedProjetos = projetos;
  lastReadTime = Date.now();
};

const saveFullDB = (db: DB) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(db, null, 2));
  cachedProjetos = db.projetos;
  lastReadTime = Date.now();
};

export const createLog = (acao: string, justificativa: string = "Nenhuma", user: string = "Usuário"): LogEntry => {
  const now = new Date();
  const dataFormatada = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  return { acao, justificativa, data: dataFormatada, user };
};

const statusMap: Record<string, { text: string; indicator: string; icon: string; iconColor: string }> = {
  ideacao:      { text: "Ideação",       indicator: "bg-blue-400",    icon: "FolderKanban", iconColor: "text-blue-400"    },
  planejamento: { text: "Planejamento",  indicator: "bg-indigo-400",  icon: "Clock",        iconColor: "text-indigo-400"  },
  desenvolvimento: { text: "Desenvolvimento", indicator: "bg-amber-500", icon: "Clock",        iconColor: "text-amber-500"   },
  testes:       { text: "Testes",        indicator: "bg-purple-500",  icon: "Clock",        iconColor: "text-purple-500"  },
  homologacao:  { text: "Homologação",   indicator: "bg-orange-500",  icon: "Clock",        iconColor: "text-orange-500"  },
  implantacao:  { text: "Implantação",   indicator: "bg-emerald-500", icon: "Clock",        iconColor: "text-emerald-500" },
  concluido:    { text: "Concluído",     indicator: "bg-emerald-600", icon: "CheckCircle2", iconColor: "text-emerald-600" },
};

export const getProjetos = (userDept?: string, papel?: string): Projeto[] => {
  const db = getDB();
  const data = db.projetos;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let list = data.map((p: any) => {
    const proj = {
      ...p,
      departamento: p.departamento || "Diretoria de Tecnologia da Informação",
      excluido: p.excluido || false,
      logs: p.logs || [],
      baselineData: p.baselineData || { inicio: "", fim: "" },
      tarefas: p.tarefas || [],
      favoritos: p.favoritos || []
    };
    
    const meta = statusMap[proj.status] || statusMap["ideacao"];
    let finalHealth = "prazo";
    let finalIcon = meta.icon;
    let finalColor = meta.iconColor;
    let finalIndicator = meta.indicator;
    let finalDelta = 0;
    let finalReason = "No prazo.";

    if (proj.baselineData.fim && proj.progress < 100) {
      const parts = proj.baselineData.fim.split("-");
      const dFim = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      dFim.setHours(0,0,0,0);
      if (dFim < hoje) {
        finalDelta = Math.ceil((hoje.getTime() - dFim.getTime()) / (1000 * 3600 * 24));
        finalHealth = "atrasados";
        finalIcon = "AlertCircle";
        finalColor = "text-rose-500";
        finalIndicator = "bg-rose-500";
        finalReason = `Projeto atrasado há ${finalDelta} dias.`;
      }
    }

    let temImped = false;
    for (const t of proj.tarefas) {
      if (t.impedimentoAtivo) {
        temImped = true;
      }
    }

    if (temImped) {
      finalHealth = "impedimentos";
      finalIcon = "ShieldAlert";
      finalColor = "text-rose-600";
      finalIndicator = "bg-rose-600";
      finalReason = "Existem impedimentos ativos.";
    }

    if (proj.status === "concluido" || proj.progress >= 100) {
      finalHealth = "concluido";
      finalIcon = "CheckCircle2";
      finalColor = "text-emerald-600";
      finalIndicator = "bg-emerald-600";
      finalReason = "Concluído.";
    }

    return {
      ...proj,
      healthStatus: finalHealth,
      icon: finalIcon,
      iconColor: finalColor,
      indicator: finalIndicator,
      delta: finalDelta,
      healthReason: finalReason,
      text: finalHealth.charAt(0).toUpperCase() + finalHealth.slice(1)
    };
  });

  if (papel && papel !== 'admin_total') {
    list = list.filter((p: Projeto) => p.departamento === userDept);
  }

  return list.sort((a, b) => a.nome.localeCompare(b.nome));
};

export const getAuditoria = (userDept?: string, papel?: string): any[] => {
  const projetos = getProjetos(userDept, papel);
  const allLogs: any[] = [];
  projetos.forEach(p => {
    p.logs.forEach(l => {
      allLogs.push({ ...l, projetoId: p.id, projetoNome: p.nome, departamento: p.departamento });
    });
  });
  return allLogs.sort((a, b) => b.data.localeCompare(a.data));
};

export const getProjetoById = (id: number, userDept?: string, papel?: string): Projeto => {
  const projetos = getProjetos(userDept, papel);
  const projeto = projetos.find(p => p.id === id);
  if (!projeto) throw new Error("Projeto não encontrado.");
  return projeto;
};

export const createProjeto = (nome: string, responsavel: string, departamento: string = "Diretoria de Tecnologia da Informação", inicio: string = "", fim: string = ""): Projeto => {
  const projetos = getProjetos(); 
  const novoId = projetos.length > 0 ? Math.max(...projetos.map(p => p.id)) + 1 : 1;
  const novoProjeto: Projeto = {
    id: novoId, nome, status: "ideação", andamento: true, progress: 0, delta: 0, text: "Ideação",
    indicator: "bg-blue-400", icon: "FolderKanban", iconColor: "text-blue-400", responsavel, departamento,
    excluido: false, logs: [createLog("Criação do Projeto")], baselineData: { inicio, fim }, tarefas: [], favoritos: []
  };
  projetos.unshift(novoProjeto);
  saveDB(projetos);
  return novoProjeto;
};

export const deleteProjeto = (id: number, justificativa: string, user: string = "Usuário"): void => {
  const projetos = getProjetos();
  const idx = projetos.findIndex(p => p.id === id);
  if (idx !== -1) {
    projetos[idx].excluido = true;
    projetos[idx].logs.unshift(createLog("Excluído", justificativa, user));
    saveDB(projetos);
  }
};

export const updateBaseline = (id: number, inicio: string, fim: string, justificativa: string = "Ajuste", user: string = "Usuário"): Projeto => {
  const projetos = getProjetos();
  const idx = projetos.findIndex(p => p.id === id);
  if (idx === -1) throw new Error("Projeto não encontrado.");
  projetos[idx].baselineData = { inicio, fim };
  projetos[idx].logs.unshift(createLog(`Repactuação: ${formatarDataBR(inicio)} - ${formatarDataBR(fim)}`, justificativa, user));
  saveDB(projetos);
  return projetos[idx];
};

export const updateTarefas = (id: number, tarefas: Tarefa[], user: string = "Usuário", acao?: string, just?: string): Projeto => {
  const projetos = getProjetos();
  const idx = projetos.findIndex(p => p.id === id);
  if (idx === -1) throw new Error("Projeto não encontrado.");
  projetos[idx].tarefas = tarefas;
  projetos[idx].logs.unshift(createLog(acao || "Atualização de EAP", just || "Alteração de tarefas", user));
  
  if (tarefas.length > 0) {
    let totalPond = 0, totalDias = 0;
    tarefas.forEach(t => {
      const i = t.dataInicio ? new Date(t.dataInicio) : new Date();
      const f = t.dataFim ? new Date(t.dataFim) : i;
      const d = Math.ceil(Math.abs(f.getTime() - i.getTime()) / (1000 * 3600 * 24)) + 1;
      totalPond += (t.progress || 0) * d;
      totalDias += d;
    });
    projetos[idx].progress = totalDias > 0 ? Math.round(totalPond / totalDias) : 0;
  }
  saveDB(projetos);
  return projetos[idx];
};

export const toggleFavorite = (id: number, userName: string): Projeto => {
  const projetos = getProjetos();
  const idx = projetos.findIndex(p => p.id === id);
  if (idx === -1) throw new Error("Projeto não encontrado.");
  if (!projetos[idx].favoritos) projetos[idx].favoritos = [];
  const favIndex = projetos[idx].favoritos.indexOf(userName);
  if (favIndex === -1) projetos[idx].favoritos.push(userName);
  else projetos[idx].favoritos.splice(favIndex, 1);
  saveDB(projetos);
  return projetos[idx];
};

export const saveRelatorio = (relatorio: Relatorio) => {
  const db = getDB();
  db.relatorios.unshift(relatorio);
  saveFullDB(db);
};

export const getRelatorios = (userDept?: string, papel?: string): Relatorio[] => {
  const db = getDB();
  let list = db.relatorios || [];
  
  if (papel && papel !== 'admin_total') {
    list = list.filter(r => r.diretoria === userDept);
  }
  
  return list;
};

export const getRelatorioById = (id: string): Relatorio | undefined => {
  const db = getDB();
  return db.relatorios.find(r => r.id === id);
};
