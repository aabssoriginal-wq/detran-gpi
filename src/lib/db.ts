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
    
    // O db.ts já deve ter limpado a pasta se FORCE_CLEAN estiver true, 
    // mas garantimos aqui também.
    if (process.env.FORCE_CLEAN === 'true') {
       // Apenas garantimos a existência após a possível limpeza no db.ts
    }

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
  departamento?: string; // NOVO: Departamento vinculado ao projeto
  excluido: boolean;
  logs: LogEntry[];
  baselineData: BaselineData;
  tarefas: Tarefa[];
  escopo?: string; // NOVO: Escopo do projeto (limite 350 chars)
}

const defaultBaseline = { inicio: "2026-01-01", fim: "2026-12-31" };

let cachedProjetos: Projeto[] | null = null;
let lastReadTime: number = 0;
const CACHE_TTL = 5000;

const initializeDB = () => {
  // Se estiver no Azure e o arquivo persistente não existir, tenta copiar do pacote original
  if (process.env.WEBSITE_INSTANCE_ID !== undefined && !fs.existsSync(dataFilePath)) {
    const packageDataPath = path.join(process.cwd(), 'data.json');
    if (fs.existsSync(packageDataPath)) {
      try {
        const initialContent = fs.readFileSync(packageDataPath, 'utf-8');
        fs.writeFileSync(dataFilePath, initialContent);
        console.log("Banco de dados inicializado a partir do pacote de deploy.");
      } catch (e) {
        console.error("Erro ao copiar banco de dados inicial:", e);
      }
    }
  }

  if (!fs.existsSync(dataFilePath)) {
    const initialData: Projeto[] = [
      { id: 1, nome: "Identidade Digital (SSO)", status: "prazo", andamento: true, progress: 85, delta: 0, text: "No Prazo", indicator: "bg-emerald-500", icon: "CheckCircle2", iconColor: "text-emerald-500", responsavel: "Luiz Wanderley", departamento: "Diretoria de Tecnologia da Informação", excluido: false, logs: [], baselineData: { inicio: "2026-05-01", fim: "2026-12-15" }, tarefas: [] },
      { id: 2, nome: "Migração para Azure Cloud", status: "atrasados", andamento: true, progress: 45, delta: 18, text: "Delta: +18 dias", indicator: "bg-rose-500", icon: "AlertCircle", iconColor: "text-rose-500", responsavel: "Equipe Infra", departamento: "Diretoria de Tecnologia da Informação", excluido: false, logs: [], baselineData: { inicio: "2026-03-01", fim: "2026-10-30" }, tarefas: [] },
      { id: 3, nome: "Novo Portal do Cliente", status: "risco", andamento: true, progress: 30, delta: 5, text: "Delta: +5 dias", indicator: "bg-amber-500", icon: "Clock", iconColor: "text-amber-500", responsavel: "Equipe Front", departamento: "Diretoria de Tecnologia da Informação", excluido: false, logs: [], baselineData: { inicio: "2026-06-01", fim: "2026-11-20" }, tarefas: [] }
    ];
    fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
  }
};

const saveDB = (projetos: Projeto[]) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(projetos, null, 2));
  cachedProjetos = projetos;
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
  initializeDB();
  const fileData = fs.readFileSync(dataFilePath, 'utf-8');
  let data = JSON.parse(fileData);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let list = data.map((p: any) => {
    const proj = {
      ...p,
      departamento: p.departamento || "Diretoria de Tecnologia da Informação", // Migração legada
      excluido: p.excluido || false,
      logs: p.logs || [],
      baselineData: p.baselineData || { inicio: "", fim: "" },
      tarefas: p.tarefas || []
    };
    
    const meta = statusMap[proj.status] || statusMap["ideacao"];
    let finalHealth = "prazo";
    let finalIcon = meta.icon;
    let finalColor = meta.iconColor;
    let finalIndicator = meta.indicator;
    let finalDelta = 0;
    let finalReason = "No prazo.";

    // 1. Verificação de Atraso Global
    let atrasoGlobal = false;
    if (proj.baselineData.fim && proj.progress < 100) {
      const parts = proj.baselineData.fim.split("-");
      const dFim = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      dFim.setHours(0,0,0,0);
      if (dFim < hoje) {
        atrasoGlobal = true;
        finalDelta = Math.ceil((hoje.getTime() - dFim.getTime()) / (1000 * 3600 * 24));
      }
    }

    // 2. Verificação Interna
    let temImped = false;
    let temTrafAtras = false;
    let nomeTrafAtras = "";
    let deltaTrafAtras = 0;

    for (const t of proj.tarefas) {
      if (t.impedimentoAtivo) {
        temImped = true;
        (proj as any).tarefaBloqueada = t.titulo;
        (proj as any).motivoBloqueio = t.motivoImpedimento;
        (proj as any).responsavelTecnico = t.responsavel;
      }
      if (t.dataFim && t.progress < 100) {
        const pT = t.dataFim.split("-");
        const dfT = new Date(parseInt(pT[0]), parseInt(pT[1]) - 1, parseInt(pT[2]));
        dfT.setHours(0,0,0,0);
        if (dfT < hoje) {
          temTrafAtras = true;
          nomeTrafAtras = t.titulo;
          deltaTrafAtras = Math.ceil((hoje.getTime() - dfT.getTime()) / (1000 * 3600 * 24));
        }
      }
    }

    if (temImped) {
      finalHealth = "impedimentos";
      finalIcon = "ShieldAlert";
      finalColor = "text-rose-600";
      finalIndicator = "bg-rose-600";
      finalReason = `Bloqueado: ${(proj as any).motivoBloqueio || "Sem motivo"}`;
    } else if (atrasoGlobal) {
      finalHealth = "atrasados";
      finalIcon = "AlertCircle";
      finalColor = "text-rose-500";
      finalIndicator = "bg-rose-500";
      finalReason = `Projeto atrasado há ${finalDelta} dias.`;
    } else if (temTrafAtras) {
      finalHealth = "risco";
      finalIcon = "Clock";
      finalColor = "text-amber-500";
      finalIndicator = "bg-amber-500";
      finalDelta = deltaTrafAtras;
      finalReason = `Tarefa "${nomeTrafAtras}" atrasada.`;
    }

    if (proj.status === "concluído" || proj.progress >= 100) {
      finalHealth = "concluído";
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
    list = list.filter((p: Projeto) => {
      if (p.departamento !== userDept) return false;
      if (papel === 'admin_master' || papel === 'usuario_master') return true;
      const isOrphan = p.responsavel === "Não Definido" || !p.responsavel;
      return isOrphan || p.responsavel === userDept || (p as any).isAtribuido;
    });
  }

  return list.sort((a, b) => a.nome.localeCompare(b.nome));
};

export const getAuditoria = (userDept?: string, papel?: string): any[] => {
  const projetos = getProjetos(userDept, papel);
  const allLogs: any[] = [];
  
  projetos.forEach(p => {
    p.logs.forEach(l => {
      allLogs.push({
        ...l,
        projetoId: p.id,
        projetoNome: p.nome,
        departamento: p.departamento
      });
    });
  });

  return allLogs.sort((a, b) => {
    const parseDate = (d: string) => {
      const [date, time] = d.split(' ');
      const [day, month, year] = date.split('/');
      const [hour, min] = time.split(':');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min)).getTime();
    };
    return parseDate(b.data) - parseDate(a.data);
  });
};

export const getProjetoById = (id: number, userDept?: string, papel?: string): Projeto => {
  const projetos = getProjetos(userDept, papel);
  const projeto = projetos.find(p => p.id === id);
  if (!projeto) throw new Error("Projeto não encontrado ou acesso negado.");
  return projeto;
};

export const addLogToProjeto = (id: number, log: LogEntry): void => {
  const projetos = getProjetos();
  const index = projetos.findIndex(p => p.id === id);
  if (index !== -1) {
    projetos[index].logs.unshift(log);
    saveDB(projetos);
  }
};

export const createProjeto = (nome: string, responsavel: string, departamento: string = "Diretoria de Tecnologia da Informação", inicio: string = "", fim: string = ""): Projeto => {
  const projetos = getProjetos(); 
  const novoId = projetos.length > 0 ? Math.max(...projetos.map(p => p.id)) + 1 : 1;
  const novoProjeto: Projeto = {
    id: novoId,
    nome,
    status: "ideação",
    andamento: true,
    progress: 0,
    delta: 0,
    text: "Ideação",
    indicator: "bg-blue-400",
    icon: "FolderKanban", 
    iconColor: "text-blue-400",
    responsavel,
    departamento, 
    excluido: false,
    logs: [createLog("Criação do Projeto")],
    baselineData: { inicio, fim },
    tarefas: []
  };
  projetos.unshift(novoProjeto);
  saveDB(projetos);
  return novoProjeto;
};

export const renameProjeto = (id: number, novoNome: string, justificativa: string, user: string = "Usuário"): Projeto => {
  const projetos = getProjetos();
  const idx = projetos.findIndex(p => p.id === id);
  if (idx === -1) throw new Error("Projeto não encontrado.");
  projetos[idx].nome = novoNome;
  projetos[idx].logs.unshift(createLog(`Renomeado`, justificativa, user));
  saveDB(projetos);
  return projetos[idx];
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

export const restoreProjeto = (id: number, justificativa: string, user: string = "Usuário"): void => {
  const projetos = getProjetos();
  const idx = projetos.findIndex(p => p.id === id);
  if (idx !== -1) {
    projetos[idx].excluido = false;
    projetos[idx].logs.unshift(createLog("Restaurado", justificativa, user));
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

export const updateTarefas = (id: number, tarefas: Tarefa[], user: string = "Usuário"): Projeto => {
  const projetos = getProjetos();
  const idx = projetos.findIndex(p => p.id === id);
  if (idx === -1) throw new Error("Projeto não encontrado.");
  projetos[idx].tarefas = tarefas;
  projetos[idx].logs.unshift(createLog("Atualização de EAP", "Alteração de tarefas", user));

  if (tarefas.length > 0) {
    let totalPond = 0;
    let totalDias = 0;
    tarefas.forEach(t => {
      const i = t.dataInicio ? new Date(t.dataInicio) : new Date();
      const f = t.dataFim ? new Date(t.dataFim) : i;
      const d = Math.ceil(Math.abs(f.getTime() - i.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      totalPond += (t.progress || 0) * d;
      totalDias += d;
    });
    projetos[idx].progress = totalDias > 0 ? Math.round(totalPond / totalDias) : 0;
  }
  
  saveDB(projetos);
  return projetos[idx];
};

export const updateProjetoStatus = (id: number, status: string, justificativa: string, user: string = "Usuário"): Projeto => {
  const projetos = getProjetos();
  const idx = projetos.findIndex(p => p.id === id);
  if (idx === -1) throw new Error("Projeto não encontrado.");
  projetos[idx].status = status;
  projetos[idx].logs.unshift(createLog(`Alteração de Fase para ${status}`, justificativa, user));
  saveDB(projetos);
  return projetos[idx];
};

export const updateEscopo = (id: number, escopo: string, user: string = "Usuário"): Projeto => {
  const projetos = getProjetos();
  const idx = projetos.findIndex(p => p.id === id);
  if (idx === -1) throw new Error("Projeto não encontrado.");
  
  const antigoEscopo = (projetos[idx] as any).escopo;
  const isInicial = !antigoEscopo || antigoEscopo.trim() === "";
  
  (projetos[idx] as any).escopo = escopo;
  
  const acaoLog = isInicial ? "Cadastro inicial de escopo" : "Alteração de escopo";
  projetos[idx].logs.unshift(createLog(acaoLog, isInicial ? "Definição do escopo" : "Atualização de diretrizes", user));
  
  saveDB(projetos);
  return projetos[idx];
};

export const updateResponsavel = (id: number, userId: string, nomeResponsavel: string, user: string = "Usuário"): Projeto => {
  const projetos = getProjetos();
  const idx = projetos.findIndex(p => p.id === id);
  if (idx === -1) throw new Error("Projeto não encontrado.");
  projetos[idx].responsavel = nomeResponsavel;
  projetos[idx].logs.unshift(createLog(`Responsável alterado para ${nomeResponsavel}`, "Atribuição", user));
  saveDB(projetos);
  return projetos[idx];
};

export const updateProjetoDepartamento = (id: number, novoDept: string, justificativa: string, user: string = "Usuário"): Projeto => {
  const projetos = getProjetos();
  const idx = projetos.findIndex(p => p.id === id);
  if (idx === -1) throw new Error("Projeto não encontrado.");
  const antigo = projetos[idx].departamento;
  projetos[idx].departamento = novoDept;
  projetos[idx].logs.unshift(createLog(`Diretoria alterada: ${antigo} → ${novoDept}`, justificativa, user));
  saveDB(projetos);
  return projetos[idx];
};
