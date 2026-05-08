import { prisma } from './prisma';
import { formatarDataBR } from "./utils";

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

export interface RecursoProjeto {
  id: string;
  nome: string;
  quantidade: string;
}

export interface ContatoTerceiro {
  nome: string;
  email: string;
  telefone: string;
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
  escopoDetalhado?: string;
  contrato?: {
    empresaContratada?: string;
    numeroESP?: string;
    processoSEI?: string;
  };
  recursos?: RecursoProjeto[];
  terceiros?: {
    gerenteProdesp?: ContatoTerceiro;
    empresaParceira?: string;
    gerenteParceira?: ContatoTerceiro;
  };
  favoritos: string[];
}

export interface Relatorio {
  id: string;
  nome: string;
  dataGeracao: string;
  geradoEm?: string;
  autor: string;
  diretoria: string;
  panorama: any[]; 
  detalhes: any[]; 
}

export const createLog = (acao: string, justificativa: string = "Nenhuma", user: string = "Usuário"): LogEntry => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dataFormatada = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return { acao, justificativa, data: dataFormatada, user };
};

const parseDataBR = (s: string): Date => {
  const [data, hora] = s.split(' ');
  const [d, m, y] = data.split('/').map(Number);
  const [h, min] = hora.split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
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

export const getProjetos = async (userDept?: string, papel?: string): Promise<Projeto[]> => {
  const data = await prisma.project.findMany({
    include: {
      tarefas: true,
      logs: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let list = data.map((p: any) => {
    const baseline = (p.baselineData as any) || { inicio: "", fim: "" };
    
    const proj: any = {
      ...p,
      baselineData: baseline,
      logs: p.logs.map((l: any) => ({ acao: l.acao, data: l.data, justificativa: l.justificativa, user: l.user })),
      tarefas: p.tarefas.map((t: any) => ({ ...t, lancamentos: (t.lancamentos as any) || [] })),
      favoritos: p.favoritos || []
    };
    
    const meta = statusMap[proj.status] || statusMap["ideacao"];
    let finalHealth = "prazo";
    let finalIcon = meta.icon;
    let finalColor = meta.iconColor;
    let finalIndicator = meta.indicator;
    let finalDelta = 0;
    let finalReason = "No prazo.";

    if (baseline.fim && proj.progress < 100) {
      const parts = baseline.fim.split("-");
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

    let temImped = proj.tarefas.some((t: any) => t.impedimentoAtivo);

    if (temImped) {
      finalHealth = "impedimentos";
      finalIcon = "ShieldAlert";
      finalColor = "text-rose-600";
      finalIndicator = "bg-rose-600";
      finalReason = "Bloqueado por impedimento.";
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
    list = list.filter((p: any) => p.departamento === userDept);
  }

  return list.sort((a: any, b: any) => a.nome.localeCompare(b.nome));
};

export const getAuditoria = async (userDept?: string, papel?: string): Promise<any[]> => {
  const projetos = await getProjetos(userDept, papel);
  const allLogs: any[] = [];
  projetos.forEach(p => {
    p.logs.forEach(l => {
      allLogs.push({ ...l, projetoId: p.id, projetoNome: p.nome, departamento: p.departamento });
    });
  });
  return allLogs.sort((a, b) => {
    try {
      return parseDataBR(b.data).getTime() - parseDataBR(a.data).getTime();
    } catch (e) {
      return b.data.localeCompare(a.data);
    }
  });
};

export const getProjetoById = async (id: number, userDept?: string, papel?: string): Promise<Projeto> => {
  const projetos = await getProjetos(userDept, papel);
  const projeto = projetos.find(p => p.id === id);
  if (!projeto) throw new Error("Projeto não encontrado.");
  return projeto;
};

export const createProjeto = async (nome: string, responsavel: string, departamento: string = "Diretoria de Tecnologia da Informação", inicio: string = "", fim: string = ""): Promise<Projeto> => {
  const novoProjeto = await prisma.project.create({
    data: {
      nome,
      status: "ideacao",
      responsavel,
      departamento,
      baselineData: { inicio, fim },
      logs: {
        create: [
          {
            acao: "Criação do Projeto",
            data: createLog("Criação do Projeto").data,
            user: "Sistema"
          }
        ]
      }
    },
    include: { tarefas: true, logs: true }
  });
  return await getProjetoById(novoProjeto.id);
};

export const renameProjeto = async (id: number, novoNome: string, justificativa: string, user: string = "Usuário"): Promise<Projeto> => {
  const log = createLog("Renomeado", justificativa, user);
  await prisma.project.update({
    where: { id },
    data: {
      nome: novoNome,
      logs: {
        create: {
          acao: log.acao,
          data: log.data,
          justificativa: log.justificativa,
          user: log.user
        }
      }
    }
  });
  return await getProjetoById(id);
};

export const deleteProjeto = async (id: number, justificativa: string, user: string = "Usuário"): Promise<void> => {
  const log = createLog("Excluído", justificativa, user);
  await prisma.project.update({
    where: { id },
    data: {
      excluido: true,
      logs: {
        create: {
          acao: log.acao,
          data: log.data,
          justificativa: log.justificativa,
          user: log.user
        }
      }
    }
  });
};

export const restoreProjeto = async (id: number, justificativa: string, user: string = "Usuário"): Promise<void> => {
  const log = createLog("Restaurado", justificativa, user);
  await prisma.project.update({
    where: { id },
    data: {
      excluido: false,
      logs: {
        create: {
          acao: log.acao,
          data: log.data,
          justificativa: log.justificativa,
          user: log.user
        }
      }
    }
  });
};

export const permanentlyDeleteProjeto = async (id: number): Promise<void> => {
  await prisma.project.delete({ where: { id } });
};

export const updateBaseline = async (id: number, inicio: string, fim: string, justificativa: string = "Ajuste", user: string = "Usuário"): Promise<Projeto> => {
  const log = createLog(`Repactuação: ${formatarDataBR(inicio)} - ${formatarDataBR(fim)}`, justificativa, user);
  await prisma.project.update({
    where: { id },
    data: {
      baselineData: { inicio, fim },
      logs: {
        create: {
          acao: log.acao,
          data: log.data,
          justificativa: log.justificativa,
          user: log.user
        }
      }
    }
  });
  return await getProjetoById(id);
};

export const updateTarefas = async (id: number, tarefas: Tarefa[], user: string = "Usuário", acao?: string, just?: string): Promise<Projeto> => {
  // Cálculo de progresso ponderado
  let totalPond = 0, totalDias = 0;
  tarefas.forEach(t => {
    const i = t.dataInicio ? new Date(t.dataInicio) : new Date();
    const f = t.dataFim ? new Date(t.dataFim) : i;
    const d = Math.ceil(Math.abs(f.getTime() - i.getTime()) / (1000 * 3600 * 24)) + 1;
    totalPond += (t.progress || 0) * d;
    totalDias += d;
  });
  const newProgress = totalDias > 0 ? Math.round(totalPond / totalDias) : 0;

  const log = createLog(acao || "Atualização de EAP", just || "Alteração de tarefas", user);

  // No Prisma, para atualizar tarefas de forma atômica (substituir todas), podemos deletar e recriar ou usar upsert
  // Como as tarefas têm IDs estáveis vindos do front, vamos usar upsert
  await prisma.$transaction(async (tx) => {
    // 1. Atualiza o progresso e log do projeto
    await tx.project.update({
      where: { id },
      data: {
        progress: newProgress,
        logs: {
          create: {
            acao: log.acao,
            data: log.data,
            justificativa: log.justificativa,
            user: log.user
          }
        }
      }
    });

    // 2. Remove tarefas que não estão mais na lista
    const tarefaIds = tarefas.map(t => t.id);
    await tx.task.deleteMany({
      where: {
        projectId: id,
        id: { notIn: tarefaIds }
      }
    });

    // 3. Upsert das tarefas enviadas
    for (const t of tarefas) {
      await tx.task.upsert({
        where: { id: t.id },
        update: {
          titulo: t.titulo,
          status: t.status,
          progress: t.progress,
          responsavel: t.responsavel,
          dataInicio: t.dataInicio,
          dataFim: t.dataFim,
          parentId: t.parentId,
          notas: t.notas,
          impedimentoAtivo: t.impedimentoAtivo,
          motivoImpedimento: t.motivoImpedimento,
          justificativaResolucao: t.justificativaResolucao,
          responsavelTecnico: t.responsavelTecnico,
          lancamentos: t.lancamentos || []
        },
        create: {
          id: t.id,
          titulo: t.titulo,
          status: t.status,
          progress: t.progress,
          responsavel: t.responsavel,
          dataInicio: t.dataInicio,
          dataFim: t.dataFim,
          parentId: t.parentId,
          notas: t.notas,
          impedimentoAtivo: t.impedimentoAtivo,
          motivoImpedimento: t.motivoImpedimento,
          justificativaResolucao: t.justificativaResolucao,
          responsavelTecnico: t.responsavelTecnico,
          lancamentos: t.lancamentos || [],
          projectId: id
        }
      });
    }
  });

  return await getProjetoById(id);
};

export const updateProjetoStatus = async (id: number, status: string, justificativa: string, user: string = "Usuário"): Promise<Projeto> => {
  const log = createLog(`Alteração de Fase para ${status}`, justificativa, user);
  await prisma.project.update({
    where: { id },
    data: {
      status,
      logs: {
        create: {
          acao: log.acao,
          data: log.data,
          justificativa: log.justificativa,
          user: log.user
        }
      }
    }
  });
  return await getProjetoById(id);
};

export const updateEscopo = async (id: number, escopo: string, user: string = "Usuário", detalhado?: string): Promise<Projeto> => {
  const log = createLog("Atualização de Detalhes (Escopo)", "Edição manual", user);
  await prisma.project.update({
    where: { id },
    data: {
      escopo,
      escopoDetalhado: detalhado !== undefined ? detalhado : undefined,
      logs: {
        create: {
          acao: log.acao,
          data: log.data,
          justificativa: log.justificativa,
          user: log.user
        }
      }
    }
  });
  return await getProjetoById(id);
};

export const updateContrato = async (id: number, contrato: any, user: string = "Usuário"): Promise<Projeto> => {
  const log = createLog("Atualização de Informações Contratuais", "Edição manual", user);
  await prisma.project.update({
    where: { id },
    data: {
      contrato,
      logs: {
        create: {
          acao: log.acao,
          data: log.data,
          justificativa: log.justificativa,
          user: log.user
        }
      }
    }
  });
  return await getProjetoById(id);
};

export const updateRecursos = async (id: number, recursos: RecursoProjeto[], user: string = "Usuário"): Promise<Projeto> => {
  const log = createLog("Atualização de Recursos Contratados", "Edição manual", user);
  await prisma.project.update({
    where: { id },
    data: {
      recursos: recursos as any,
      logs: {
        create: {
          acao: log.acao,
          data: log.data,
          justificativa: log.justificativa,
          user: log.user
        }
      }
    }
  });
  return await getProjetoById(id);
};

export const updateTerceiros = async (id: number, terceiros: any, user: string = "Usuário"): Promise<Projeto> => {
  const log = createLog("Atualização de Informações de Terceiros", "Edição manual", user);
  await prisma.project.update({
    where: { id },
    data: {
      terceiros,
      logs: {
        create: {
          acao: log.acao,
          data: log.data,
          justificativa: log.justificativa,
          user: log.user
        }
      }
    }
  });
  
  if (terceiros.gerenteProdesp) await saveContatoGlobal(terceiros.gerenteProdesp, 'PRODESP');
  if (terceiros.gerenteParceira) await saveContatoGlobal(terceiros.gerenteParceira, 'Parceira', terceiros.empresaParceira);

  return await getProjetoById(id);
};

const saveContatoGlobal = async (contato: any, tipo: string, empresa?: string) => {
  if (!contato || !contato.nome) return;
  await prisma.thirdPartyContact.upsert({
    where: { id: contato.nome + (contato.email || '') }, // Fallback para ID
    update: {
      email: contato.email,
      telefone: contato.telefone,
      tipo,
      empresa: empresa || (tipo === 'PRODESP' ? 'PRODESP' : '')
    },
    create: {
      nome: contato.nome,
      email: contato.email,
      telefone: contato.telefone,
      tipo,
      empresa: empresa || (tipo === 'PRODESP' ? 'PRODESP' : '')
    }
  });
};

export const getContatosGlobais = async () => {
  return await prisma.thirdPartyContact.findMany();
};

export const updateResponsavel = async (id: number, userId: string, nome: string, user: string = "Usuário"): Promise<Projeto> => {
  const log = createLog(`Responsável alterado para ${nome}`, "Atribuição", user);
  await prisma.project.update({
    where: { id },
    data: {
      responsavel: nome,
      logs: {
        create: {
          acao: log.acao,
          data: log.data,
          justificativa: log.justificativa,
          user: log.user
        }
      }
    }
  });
  return await getProjetoById(id);
};

export const updateProjetoDepartamento = async (id: number, novoDept: string, justificativa: string, user: string = "Usuário"): Promise<Projeto> => {
  const proj = await prisma.project.findUnique({ where: { id } });
  const antigo = proj?.departamento || "Não definido";
  const log = createLog(`Diretoria alterada: ${antigo} → ${novoDept}`, justificativa, user);
  await prisma.project.update({
    where: { id },
    data: {
      departamento: novoDept,
      logs: {
        create: {
          acao: log.acao,
          data: log.data,
          justificativa: log.justificativa,
          user: log.user
        }
      }
    }
  });
  return await getProjetoById(id);
};

export const addLogToProjeto = async (id: number, log: LogEntry): Promise<void> => {
  await prisma.log.create({
    data: {
      acao: log.acao,
      data: log.data,
      justificativa: log.justificativa,
      user: log.user,
      projectId: id
    }
  });
};

export const toggleFavorite = async (id: number, userName: string): Promise<Projeto> => {
  const proj = await prisma.project.findUnique({ where: { id } });
  if (!proj) throw new Error("Projeto não encontrado.");
  let favoritos = proj.favoritos || [];
  const favIndex = favoritos.indexOf(userName);
  if (favIndex === -1) favoritos.push(userName);
  else favoritos.splice(favIndex, 1);
  
  await prisma.project.update({
    where: { id },
    data: { favoritos }
  });
  return await getProjetoById(id);
};

export const saveRelatorio = async (relatorio: Relatorio) => {
  await prisma.report.create({
    data: {
      id: relatorio.id,
      nome: relatorio.nome,
      dataGeracao: relatorio.dataGeracao,
      geradoEm: relatorio.geradoEm,
      autor: relatorio.autor,
      diretoria: relatorio.diretoria,
      panorama: relatorio.panorama,
      detalhes: relatorio.detalhes
    }
  });
};

export const getRelatorios = async (userDept?: string, papel?: string): Promise<Relatorio[]> => {
  let where: any = {};
  if (papel && papel !== 'admin_total') {
    where.diretoria = userDept;
  }
  const data = await prisma.report.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
  return data as any;
};

export const getRelatorioById = async (id: string): Promise<Relatorio | null> => {
  const data = await prisma.report.findUnique({ where: { id } });
  return data as any;
};
