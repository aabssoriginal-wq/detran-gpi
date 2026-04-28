"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Save, History, FileSpreadsheet, Calendar as CalendarIcon, ArrowLeft, 
  ShieldAlert, FileText, Lock, Plus, UserPlus, User, Trash2, Loader2, 
  CheckCircle2, AlertCircle, Clock, FolderKanban, RotateCcw, PenLine, 
  ChevronRight, ChevronDown, MessageSquare, Send, Sparkles
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { toast } from "sonner";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { formatarDataBR } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";

const FASES = [
  { id: "ideacao", label: "Ideação", color: "bg-blue-400" },
  { id: "planejamento", label: "Planejamento", color: "bg-indigo-400" },
  { id: "desenvolvimento", label: "Desenvolvimento", color: "bg-amber-500" },
  { id: "testes", label: "Testes", color: "bg-purple-500" },
  { id: "homologacao", label: "Homologação", color: "bg-orange-500" },
  { id: "implantacao", label: "Implantação", color: "bg-emerald-500" },
  { id: "concluido", label: "Concluído", color: "bg-emerald-600" },
];

function JustificativaDialogContent({ title, description, onCancel, onConfirm }: any) {
  const [val, setVal] = useState("");
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label className="flex justify-between">
            <span>Justificativa (Auditoria)</span>
            <span className="text-[10px] text-rose-500 font-bold uppercase">* Obrigatório</span>
          </Label>
          <Textarea 
            autoFocus
            placeholder="Descreva detalhadamente o motivo desta ação..." 
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button 
          disabled={!val.trim()}
          onClick={() => onConfirm(val)}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
        >
          Confirmar
        </Button>
      </div>
    </>
  );
}

export default function ProjetoDetalhePage(props: { params: Promise<{ id: string }> }) {
  const params = React.use(props.params);
  const { usuario } = useAuth();
  
  const [projetoData, setProjetoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [escopo, setEscopo] = useState("");
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const [projetoStatus, setProjetoStatus] = useState("");
  const [projetoProgress, setProjetoProgress] = useState(0);

  const [novaTarefa, setNovaTarefa] = useState({ 
    titulo: "", 
    dataInicio: "", 
    dataFim: "", 
    responsavel: "",
    parentId: "" 
  });

  const [editBaseline, setEditBaseline] = useState({ inicio: "", fim: "" });

  const [impedimentoData, setImpedimentoData] = useState({
    tarefaId: "",
    motivo: "",
    dataBloqueio: "",
    dataPrevisao: ""
  });

  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<{role: 'user'|'assistant', content: string}[]>([]);
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<any[]>([]);


  // Estado para Repactuação de Datas
  const [repactuacaoData, setRepactuacaoData] = useState<{
    tarefaId: string, 
    updates: any, 
    mensagem: string, 
    isOpen: boolean 
  }>({ tarefaId: "", updates: {}, mensagem: "", isOpen: false });

  // Estado para Modal de Anotações (Lançamentos)
  const [selectedTarefaParaNotas, setSelectedTarefaParaNotas] = useState<any | null>(null);
  const [novoLancamento, setNovoLancamento] = useState("");
  const [arquivoAnexo, setArquivoAnexo] = useState<string | null>(null);
  
  // Estado para Diálogo de Justificativa (Substituindo window.prompt)
  const [justificativaDialog, setJustificativaDialog] = useState<{
    isOpen: boolean,
    title: string,
    description: string,
    value: string,
    onConfirm: (val: string) => void
  }>({
    isOpen: false,
    title: "",
    description: "",
    value: "",
    onConfirm: () => {}
  });

  const [novaSubTarefa, setNovaSubTarefa] = useState({
    titulo: "",
    responsavel: "",
    dataInicio: "",
    dataFim: ""
  });

  const [subTarefaModal, setSubTarefaModal] = useState({
    isOpen: false,
    parentId: "",
    parentTitle: ""
  });

  const loadData = () => {
    if (!usuario) return;
    Promise.all([
      fetch(`/api/projects/${params.id}?dept=${encodeURIComponent(usuario.departamento)}&role=${usuario.papel}`).then(res => res.json()),
      fetch(`/api/users`).then(res => res.json())
    ])
      .then(([data, users]) => {
        if (data.error) {
          toast.error(data.error);
          router.push("/dashboard");
          return;
        }
        setProjetoData(data);
        setLogs(data.logs || []);
        setEscopo(data.escopo || "");
        setTarefas(data.tarefas || []);
        // Normaliza status: valores legados (prazo, atrasados, risco) → vazio
        const fasesValidas = ["ideacao","planejamento","desenvolvimento","testes","homologacao","implantacao","concluido"];
        const statusNormalizado = fasesValidas.includes(data.status) ? data.status : "ideacao";
        setProjetoStatus(statusNormalizado);
        setProjetoProgress(data.progress || 0);
        setEditBaseline({ 
          inicio: data.baselineData?.inicio || "", 
          fim: data.baselineData?.fim || "" 
        });
        setUsuariosDisponiveis(users);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Erro ao carregar projeto");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [params.id, usuario]);

  const addLog = async (acao: string, justificativa: string = "Nenhuma") => {
    try {
      await fetch(`/api/projects/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "add_log", 
          acao, 
          justificativa, 
          user: usuario?.nome || "Usuário", 
          papel: usuario?.papel,
          dept: usuario?.departamento
        })
      });
      loadData();
    } catch (e) {
      console.error("Erro log", e);
    }
  };

  const syncTarefas = async (list: any[]) => {
    setTarefas(list);
    await fetch(`/api/projects/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        action: "update_tarefas", 
        tarefas: list, 
        user: usuario?.nome || "Usuário", 
        papel: usuario?.papel,
        dept: usuario?.departamento
      })
    });
  };

  const handleSaveEscopo = async () => {
    if (escopo.length > 350) {
      toast.error("O escopo deve ter no máximo 350 caracteres.");
      return;
    }
    
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "update_escopo", 
          escopo: escopo.trim(), 
          user: usuario?.nome || "Usuário", 
          papel: usuario?.papel,
          dept: usuario?.departamento
        })
      });
      if (res.ok) {
        toast.success("Escopo salvo com sucesso!");
        loadData();
      }
    } catch (e) {
      toast.error("Erro ao salvar escopo.");
    }
  };

  const handleAdicionarTarefa = async (forceRepactuacao: boolean = false, taskOverride?: any) => {
    const taskSource = taskOverride || novaTarefa;
    
    if (!taskSource.titulo || !taskSource.dataInicio || !taskSource.dataFim) {
      toast.error("Preencha título e datas.");
      return;
    }

    let currentTarefas = [...tarefas];
    let currentBaseline = { ...projetoData.baselineData };
    let needsBaselineUpdate = false;

    const inicio = new Date(taskSource.dataInicio);
    const fim = new Date(taskSource.dataFim);

    // Validação de Hierarquia
    if (taskSource.parentId && taskSource.parentId !== "none") {
      const pai = currentTarefas.find(t => t.id === taskSource.parentId);
      if (pai) {
        const inicioPai = pai.dataInicio ? new Date(pai.dataInicio) : null;
        const fimPai = pai.dataFim ? new Date(pai.dataFim) : null;
        const foraDoRangePai = (inicioPai && inicio < inicioPai) || (fimPai && fim > fimPai);

        if (foraDoRangePai && !forceRepactuacao) {
          setRepactuacaoData({
            tarefaId: "NEW_TASK",
            updates: { ...taskSource },
            mensagem: `As datas desta nova subtarefa extrapolam o período da tarefa pai "${pai.titulo}". Deseja repactuar a hierarquia automaticamente?`,
            isOpen: true
          });
          return;
        }

        if (foraDoRangePai && forceRepactuacao) {
          const paiUpdates: any = {};
          if (inicioPai && inicio < inicioPai) paiUpdates.dataInicio = taskSource.dataInicio;
          if (fimPai && fim > fimPai) paiUpdates.dataFim = taskSource.dataFim;
          const result = await handleUpdateTarefaInternal(pai.id, paiUpdates, true, currentTarefas, currentBaseline);
          currentTarefas = result.tarefas;
          currentBaseline = result.baseline;
          needsBaselineUpdate = result.needsBaselineUpdate;
        }
      }
    } else {
      const inicioProj = currentBaseline.inicio ? new Date(currentBaseline.inicio) : null;
      const fimProj = currentBaseline.fim ? new Date(currentBaseline.fim) : null;
      const foraDoRangeProj = (inicioProj && inicio < inicioProj) || (fimProj && fim > fimProj);

      if (foraDoRangeProj && !forceRepactuacao) {
        setRepactuacaoData({
          tarefaId: "NEW_TASK",
          updates: { ...taskSource },
          mensagem: `As datas desta nova tarefa extrapolam o período definido para o PROJETO. Deseja repactuar as datas globais do projeto?`,
          isOpen: true
        });
        return;
      }

      if (foraDoRangeProj && forceRepactuacao) {
        if (inicioProj && inicio < inicioProj) currentBaseline.inicio = taskSource.dataInicio;
        if (fimProj && fim > fimProj) currentBaseline.fim = taskSource.dataFim;
        needsBaselineUpdate = true;
      }
    }

    if (needsBaselineUpdate) {
      await fetch(`/api/projects/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "update_baseline", 
          inicio: currentBaseline.inicio, 
          fim: currentBaseline.fim, 
          user: usuario?.nome, 
          papel: usuario?.papel, 
          dept: usuario?.departamento,
          justificativa: "Repactuação automática por inclusão de tarefa" 
        })
      });
    }

    const tarefa = {
      id: Math.random().toString(36).substr(2, 9),
      ...taskSource,
      progress: 0,
      status: "ideacao",
      notas: "",
      lancamentos: [],
      impedimentoAtivo: false
    };
    
    currentTarefas.push(tarefa);
    await syncTarefas(currentTarefas);
    if (!taskOverride) {
      setNovaTarefa({ titulo: "", dataInicio: "", dataFim: "", responsavel: "", parentId: "" });
    }
    addLog(`Criou tarefa: ${tarefa.titulo}`);
    toast.success("Tarefa criada com sucesso!");
    loadData();
  };

  // Função interna para lidar com a recursão sem depender do estado assíncrono
  const handleUpdateTarefaInternal = async (id: string, updates: any, forceRepactuacao: boolean, currentTarefas: any[], currentBaseline: any): Promise<{tarefas: any[], baseline: any, needsBaselineUpdate: boolean}> => {
    let updatedTarefas = [...currentTarefas];
    let updatedBaseline = { ...currentBaseline };
    let needsUpdate = false;

    const tarefaIdx = updatedTarefas.findIndex(t => t.id === id);
    if (tarefaIdx === -1) return { tarefas: updatedTarefas, baseline: updatedBaseline, needsBaselineUpdate: false };
    
    const tarefa = updatedTarefas[tarefaIdx];

    if ((updates.dataInicio || updates.dataFim)) {
      const inicio = new Date(updates.dataInicio || tarefa.dataInicio || "1900-01-01");
      const fim = new Date(updates.dataFim || tarefa.dataFim || "2999-12-31");

      if (tarefa.parentId && tarefa.parentId !== "none") {
        const pai = updatedTarefas.find(t => t.id === tarefa.parentId);
        if (pai) {
          const inicioPai = pai.dataInicio ? new Date(pai.dataInicio) : null;
          const fimPai = pai.dataFim ? new Date(pai.dataFim) : null;
          const foraDoRangePai = (inicioPai && inicio < inicioPai) || (fimPai && fim > fimPai);

          if (foraDoRangePai && forceRepactuacao) {
            const paiUpdates: any = {};
            if (inicioPai && inicio < inicioPai) paiUpdates.dataInicio = updates.dataInicio || tarefa.dataInicio;
            if (fimPai && fim > fimPai) paiUpdates.dataFim = updates.dataFim || tarefa.dataFim;
            const res = await handleUpdateTarefaInternal(pai.id, paiUpdates, true, updatedTarefas, updatedBaseline);
            updatedTarefas = res.tarefas;
            updatedBaseline = res.baseline;
            needsUpdate = res.needsBaselineUpdate;
          }
        }
      } else {
        const inicioProj = updatedBaseline.inicio ? new Date(updatedBaseline.inicio) : null;
        const fimProj = updatedBaseline.fim ? new Date(updatedBaseline.fim) : null;
        const foraDoRangeProj = (inicioProj && inicio < inicioProj) || (fimProj && fim > fimProj);

        if (foraDoRangeProj && forceRepactuacao) {
          if (inicioProj && inicio < inicioProj) updatedBaseline.inicio = updates.dataInicio || tarefa.dataInicio;
          if (fimProj && fim > fimProj) updatedBaseline.fim = updates.dataFim || tarefa.dataFim;
          needsUpdate = true;
        }
      }
    }

    updatedTarefas = updatedTarefas.map(t => t.id === id ? { ...t, ...updates } : t);
    return { tarefas: updatedTarefas, baseline: updatedBaseline, needsBaselineUpdate: needsUpdate };
  };

  const handleUpdateTarefa = async (id: string, updates: any, forceRepactuacao: boolean = false) => {
    const tarefa = tarefas.find(t => t.id === id);
    if (!tarefa) return;

    if (tarefa.impedimentoAtivo && (updates.progress !== undefined || updates.status !== undefined)) {
      toast.error("Tarefa bloqueada por impedimento!");
      return;
    }

    // Validação de Datas (Pre-Check para modal)
    if ((updates.dataInicio || updates.dataFim) && !forceRepactuacao) {
      const inicio = new Date(updates.dataInicio || tarefa.dataInicio || "1900-01-01");
      const fim = new Date(updates.dataFim || tarefa.dataFim || "2999-12-31");

      if (inicio > fim) {
        toast.error("Data de início não pode ser posterior à data de fim.");
        return;
      }

      // Checar se extrapola pai ou projeto
      let foraDeEscopo = false;
      let msg = "";

      if (tarefa.parentId && tarefa.parentId !== "none") {
        const pai = tarefas.find(t => t.id === tarefa.parentId);
        if (pai) {
          const inicioPai = pai.dataInicio ? new Date(pai.dataInicio) : null;
          const fimPai = pai.dataFim ? new Date(pai.dataFim) : null;
          if ((inicioPai && inicio < inicioPai) || (fimPai && fim > fimPai)) {
            foraDeEscopo = true;
            msg = `As novas datas extrapolam a tarefa pai "${pai.titulo}". Deseja repactuar toda a hierarquia automaticamente?`;
          }
        }
      } else {
        const inicioProj = projetoData.baselineData?.inicio ? new Date(projetoData.baselineData.inicio) : null;
        const fimProj = projetoData.baselineData?.fim ? new Date(projetoData.baselineData.fim) : null;
        if ((inicioProj && inicio < inicioProj) || (fimProj && fim > fimProj)) {
          foraDeEscopo = true;
          msg = `As novas datas desta tarefa raiz extrapolam o PROJETO. Deseja repactuar o cronograma global da iniciativa?`;
        }
      }

      if (foraDeEscopo) {
        setRepactuacaoData({ tarefaId: id, updates, mensagem: msg, isOpen: true });
        return;
      }
    }

    // Execução Final com Cascata
    const result = await handleUpdateTarefaInternal(id, updates, forceRepactuacao, tarefas, projetoData.baselineData);
    
    if (result.needsBaselineUpdate) {
      await fetch(`/api/projects/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "update_baseline", 
          inicio: result.baseline.inicio, 
          fim: result.baseline.fim, 
          user: usuario?.nome, 
          papel: usuario?.papel, 
          dept: usuario?.departamento,
          justificativa: `Repactuação automática por alteração na tarefa "${tarefa.titulo}"`
        })
      });
    }

    let finalTarefas = result.tarefas;
    if (updates.status === "concluido") {
      finalTarefas = finalTarefas.map(t => t.id === id ? { ...t, progress: 100 } : t);
    }

    await syncTarefas(finalTarefas);
    if (updates.status || updates.progress !== undefined) {
      addLog(`Atualizou tarefa ${tarefa.titulo}: ${updates.status || updates.progress + '%'}`);
    }
    loadData();
  };


  const handleCreateSubTarefaGantt = async () => {
    const task = {
      ...novaSubTarefa,
      parentId: subTarefaModal.parentId
    };
    
    await handleAdicionarTarefa(false, task);
    setSubTarefaModal(prev => ({ ...prev, isOpen: false }));
    setNovaSubTarefa({ titulo: "", responsavel: "", dataInicio: "", dataFim: "" });
  };

  const handleRemoverTarefa = async (id: string) => {
    const t = tarefas.find(x => x.id === id);
    const newList = tarefas.filter(x => x.id !== id && x.parentId !== id);
    await syncTarefas(newList);
    addLog(`Removeu tarefa: ${t?.titulo}`);
  };

  const handleUpdateResponsavel = async (userId: string) => {
    const userObj = usuariosDisponiveis.find(u => u.id === userId);
    if (!userObj) return;

    // Encontrar ID do responsável antigo para remoção
    const respAntigo = usuariosDisponiveis.find(u => u.nome === projetoData.responsavel);

    try {
      // 1. Atualizar o projeto
      const resProj = await fetch(`/api/projects/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "update_responsavel", 
          responsavelId: userId, 
          responsavelNome: userObj.nome,
          user: usuario?.nome || "Usuário",
          papel: usuario?.papel,
          dept: usuario?.departamento
        })
      });

      if (resProj.ok) {
        // 2. Remover do responsável antigo se ele existia
        if (respAntigo) {
          await fetch(`/api/users`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: respAntigo.id, action: "remove_projeto", projetoId: params.id })
          });
        }

        // 3. Adicionar ao novo responsável
        await fetch(`/api/users`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: userId, action: "add_projeto", projetoId: params.id })
        });

        toast.success(`Projeto atribuído a ${userObj.nome}`);
        loadData();
      }
    } catch (e) {
      toast.error("Erro ao atualizar responsável");
    }
  };

  const handleSaveStatusGeral = async () => {
    setJustificativaDialog({
      isOpen: true,
      title: "Confirmar Alteração de Fase",
      description: `Deseja alterar a fase do projeto para "${FASES.find(f => f.id === projetoStatus)?.label}"?`,
      value: "",
      onConfirm: async (just) => {
        try {
          const res = await fetch(`/api/projects/${params.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              action: "update_status", 
              status: projetoStatus, 
              justificativa: just || "Alteração de fase",
              user: usuario?.nome || "Usuário",
              papel: usuario?.papel,
              dept: usuario?.departamento
            })
          });
          if (res.ok) {
            toast.success("Fase da iniciativa atualizada com sucesso!");
            loadData();
          }
        } catch (e) {
          toast.error("Erro ao salvar");
        }
      }
    });
  };

  const handleSaveImpedimento = () => {
    if (!impedimentoData.tarefaId || !impedimentoData.motivo) {
      toast.error("Tarefa e motivo são obrigatórios");
      return;
    }

    const tarefa = tarefas.find(t => t.id === impedimentoData.tarefaId);
    const newList = tarefas.map(t => t.id === impedimentoData.tarefaId ? { ...t, impedimentoAtivo: true, motivoImpedimento: impedimentoData.motivo } : t);
    syncTarefas(newList);

    addLog(`Impedimento em ${tarefa?.titulo}`, impedimentoData.motivo);
    toast.success("Impedimento registrado e tarefa bloqueada.");
    setImpedimentoData({ tarefaId: "", motivo: "", dataBloqueio: "", dataPrevisao: "" });
  };

  const handleResolverImpedimento = (tarefaId: string) => {
    const tarefa = tarefas.find(t => t.id === tarefaId);
    if (!tarefa) return;

    setJustificativaDialog({
      isOpen: true,
      title: "Resolver Impedimento",
      description: `Justifique a resolução do bloqueio na tarefa "${tarefa.titulo}":`,
      value: "",
      onConfirm: async (just) => {
        const newList = tarefas.map(t => t.id === tarefaId ? { ...t, impedimentoAtivo: false, justificativaResolucao: just } : t);
        await syncTarefas(newList);
        addLog(`Impedimento resolvido em ${tarefa.titulo}`, just);
        toast.success("Impedimento resolvido!");
        loadData();
      }
    });
  };

  const handleAddLancamento = () => {
    if (!novoLancamento.trim() && !arquivoAnexo) return;
    if (!selectedTarefaParaNotas) return;

    const now = new Date();
    const dataStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const novo = {
      id: Math.random().toString(36).substr(2, 9),
      texto: novoLancamento,
      data: dataStr,
      user: usuario?.nome || "Usuário",
      arquivoUrl: arquivoAnexo || undefined
    };

    const tarefaAtualizada = {
      ...selectedTarefaParaNotas,
      lancamentos: [novo, ...(selectedTarefaParaNotas.lancamentos || [])]
    };

    handleUpdateTarefa(selectedTarefaParaNotas.id, { lancamentos: tarefaAtualizada.lancamentos });
    setSelectedTarefaParaNotas(tarefaAtualizada);
    setNovoLancamento("");
    setArquivoAnexo(null);
    toast.success("Lançamento registrado!");
  };

  const handlePasteImage = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setArquivoAnexo(event.target?.result as string);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleSendAiMessage = async () => {
    if (!aiPrompt.trim()) return;
    const userMsg = { role: 'user' as const, content: aiPrompt };
    setAiMessages(prev => [...prev, userMsg]);
    setAiPrompt("");
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...aiMessages, userMsg],
          context: `Projeto: ${projetoData.nome}. Fase: ${projetoData.text}. Progresso: ${projetoData.progress}%. EAP: ${JSON.stringify(tarefas)}`
        })
      });
      const data = await res.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (e) {
      toast.error("Erro IA");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (loading || !projetoData) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto"/></div>;

  // Flags de controle de acesso
  const isDeleted = projetoData.excluido === true;
  const isAdminTotal = usuario?.papel === 'admin_total';
  const isAdmin = usuario?.papel === 'admin_total' || usuario?.papel === 'admin_master';
  const isPowerUser = isAdmin || usuario?.papel === 'usuario_master';
  
  const canEditDeleted = isAdmin;
  const isBlocked = isDeleted && !canEditDeleted;
  const canRestore = isAdmin;

  const handleRestoreProjeto = async () => {
    setJustificativaDialog({
      isOpen: true,
      title: "Reativar Projeto",
      description: "O projeto voltará para o portfólio ativo. Por favor, justifique a reativação:",
      value: "",
      onConfirm: async (just) => {
        if (!just) {
          toast.error("Justificativa é obrigatória para reativar.");
          return;
        }
        setIsRestoring(true);
        try {
          const res = await fetch(`/api/projects/${params.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "restore",
              justificativa: just,
              user: usuario?.nome || "Usuário",
              papel: usuario?.papel || "usuario",
              dept: usuario?.departamento
            })
          });
          if (res.ok) {
            toast.success("Projeto reativado com sucesso!");
            loadData();
          } else {
            const data = await res.json();
            toast.error(data.error || "Erro ao reativar.");
          }
        } catch {
          toast.error("Erro ao reativar projeto.");
        } finally {
          setIsRestoring(false);
        }
      }
    });
  };

  const getTaskDepth = (id: string, list: any[]): number => {
    let depth = 0;
    let current = list.find(t => t.id === id);
    while (current && current.parentId && current.parentId !== "none") {
      depth++;
      current = list.find(t => t.id === current.parentId);
    }
    return depth;
  };

  const getSortedTarefas = (list: any[]) => {
    const result: any[] = [];
    const walk = (parentId: string = "none") => {
      const children = list.filter(t => (t.parentId || "none") === parentId);
      // Ordenação básica por título ou data dentro do mesmo nível se desejar
      children.forEach(child => {
        result.push(child);
        walk(child.id);
      });
    };
    walk();
    return result;
  };

  const renderTarefaRow = (t: any, level = 0) => {
    const children = tarefas.filter(child => child.parentId === t.id);
    return (
      <React.Fragment key={t.id}>
        <div className={`flex items-center gap-4 p-3 border rounded-lg bg-white dark:bg-slate-900 group ${t.impedimentoAtivo ? 'border-rose-300 bg-rose-50/30' : ''}`} style={{ marginLeft: `${level * 20}px` }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{t.titulo}</span>
              {t.impedimentoAtivo && <Badge variant="destructive" className="h-5 text-[10px] animate-pulse">BLOQUEADA</Badge>}
            </div>
            <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3"/> {formatarDataBR(t.dataInicio)} até {formatarDataBR(t.dataFim)}</span>
              <div className="flex items-center gap-1 group/resp">
                <User className="h-3 w-3 text-slate-400"/>
                <input 
                  type="text"
                  placeholder="Responsável..."
                  className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-200 rounded px-1 w-32 transition-all placeholder:italic"
                  value={t.responsavel || ""}
                  onChange={(e) => handleUpdateTarefa(t.id, { responsavel: e.target.value })}
                  disabled={isBlocked}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-64">
            <Select 
              value={t.status} 
              onValueChange={(val) => handleUpdateTarefa(t.id, { status: val })}
              disabled={t.impedimentoAtivo || isBlocked}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FASES.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 flex-1">
              <input 
                type="range" min="0" max="100" 
                value={t.progress} 
                onChange={(e) => handleUpdateTarefa(t.id, { progress: parseInt(e.target.value) })}
                className="w-full h-1 accent-blue-500"
                disabled={t.impedimentoAtivo || isBlocked}
              />
              <span className="text-[10px] font-mono w-8">{t.progress}%</span>
            </div>
          </div>

          {!isBlocked && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setNovaTarefa({...novaTarefa, parentId: t.id})} title="Adicionar Sub-tarefa"><Plus className="h-4 w-4"/></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => handleRemoverTarefa(t.id)}><Trash2 className="h-4 w-4"/></Button>
            </div>
          )}
        </div>
        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded border border-dashed" style={{ marginLeft: `${(level + 1) * 20}px` }}>
            <CalendarIcon className="h-3 w-3 text-slate-400 shrink-0"/>
            <input
              type="date"
              className="text-xs border-none bg-transparent focus:outline-none text-slate-600"
              value={t.dataInicio || ""}
              onChange={e => handleUpdateTarefa(t.id, { dataInicio: e.target.value })}
              title="Data de Início"
              disabled={isBlocked}
            />
            <span className="text-slate-300 text-xs">→</span>
            <input
              type="date"
              className="text-xs border-none bg-transparent focus:outline-none text-slate-600"
              value={t.dataFim || ""}
              onChange={e => handleUpdateTarefa(t.id, { dataFim: e.target.value })}
              title="Data de Fim"
              disabled={isBlocked}
            />
            <div className="w-px h-4 bg-slate-200 mx-1"/>
            <button 
              onClick={() => setSelectedTarefaParaNotas(t)}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-blue-50 text-blue-600 transition-colors"
              title="Ver Lançamentos e Anotações"
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0"/>
              <span className="text-[10px] font-medium">
                {t.lancamentos?.length || 0} Lançamento(s)
              </span>
            </button>
          </div>
        </div>
        {children.map(child => renderTarefaRow(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Diálogo de Justificativa Reutilizável */}
      <Dialog open={justificativaDialog.isOpen} onOpenChange={(open) => setJustificativaDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-[425px]">
          <JustificativaDialogContent 
            title={justificativaDialog.title}
            description={justificativaDialog.description}
            onCancel={() => setJustificativaDialog(prev => ({ ...prev, isOpen: false }))}
            onConfirm={(val) => {
              justificativaDialog.onConfirm(val);
              setJustificativaDialog(prev => ({ ...prev, isOpen: false }));
            }}
          />
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-4 w-4"/>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{projetoData.nome}</h1>
            <Badge className={FASES.find(f => f.id === projetoData.status)?.color}>{projetoData.text}</Badge>
            {isDeleted && <Badge variant="destructive" className="animate-pulse">EXCLUÍDO</Badge>}
          </div>
          <p className="text-sm text-slate-500">Responsável: {projetoData.responsavel}</p>
        </div>
        <div className="w-48 text-right">
          <div className="text-xs font-medium mb-1">Evolução Geral: {projetoData.progress}%</div>
          <Progress value={projetoData.progress} className="h-2"/>
        </div>
      </div>

      {/* Banner de projeto excluído */}
      {isDeleted && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-800">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-rose-500 shrink-0" />
            <div>
              <p className="font-semibold text-rose-800 dark:text-rose-300">Projeto Excluído — Modo Somente Leitura</p>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                Este projeto foi excluído e não pode ser editado{canEditDeleted ? " (exceto por administradores)" : ""}. {canRestore ? "Reative-o abaixo para liberar edições totais." : "Contate um Admin ou Master para reativá-lo."}
              </p>
            </div>
          </div>
          {canRestore && (
            <button
              onClick={handleRestoreProjeto}
              disabled={isRestoring}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all disabled:opacity-50 shrink-0 shadow-sm"
            >
              {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Reativar Projeto
            </button>
          )}
        </div>
      )}

      <Tabs defaultValue="gestao">
        <TabsList className="w-full justify-start h-12 bg-slate-100 dark:bg-slate-800 p-1">
          <TabsTrigger value="gestao" className="flex-1">Lançamento</TabsTrigger>
          <TabsTrigger value="escopo" className="flex-1">Escopo</TabsTrigger>
          <TabsTrigger value="gantt" className="flex-1">Cronograma</TabsTrigger>
          <TabsTrigger value="impedimentos" className="flex-1">Impedimentos</TabsTrigger>
          <TabsTrigger value="logs" className="flex-1">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="escopo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                <FileText className="h-5 w-5" /> Definição de Escopo
              </CardTitle>
              <CardDescription>
                Descreva detalhadamente os objetivos e limites deste projeto. 
                O escopo ajuda na tomada de decisão e evita desvios de finalidade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Texto do Escopo</Label>
                  <span className={`text-[10px] font-mono ${escopo.length > 350 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                    {escopo.length}/350 caracteres
                  </span>
                </div>
                <Textarea 
                  placeholder="Ex: Este projeto visa a implementação do sistema de biometria facial para renovação de CNH..." 
                  value={escopo}
                  onChange={(e) => setEscopo(e.target.value.slice(0, 400))} // permitimos passar um pouco para o contador ficar vermelho
                  className="min-h-[200px] text-sm leading-relaxed"
                  disabled={isBlocked}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-slate-50/50 p-4">
              <p className="text-[10px] text-slate-500 max-w-[400px]">
                Nota: O cadastro inicial será registrado como "Cadastro inicial de escopo". Alterações posteriores serão registradas como "Alteração de escopo".
              </p>
              <Button 
                onClick={handleSaveEscopo}
                disabled={isBlocked || escopo.length > 350 || escopo === (projetoData.escopo || "")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="mr-2 h-4 w-4" /> Salvar Escopo
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="gestao" className="mt-6 space-y-6">
          {isBlocked ? (
            <div className="rounded-lg border border-dashed border-rose-200 bg-rose-50/40 p-10 text-center">
              <Lock className="h-8 w-8 text-rose-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-rose-700">Edições desabilitadas para projetos excluídos.</p>
              <p className="text-xs text-rose-500 mt-1">Apenas administradores podem editar projetos excluídos. Reative o projeto para liberar alterações.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-indigo-800">
                    <CalendarIcon className="h-5 w-5" /> Cronograma do Projeto
                  </CardTitle>
                  <CardDescription>Defina o período global da iniciativa.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <Label>Início do Projeto</Label>
                    <Input 
                      type="date" 
                      value={editBaseline.inicio} 
                      onChange={(e) => setEditBaseline({ ...editBaseline, inicio: e.target.value })}
                      disabled={isBlocked}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Fim do Projeto</Label>
                    <Input 
                      type="date" 
                      value={editBaseline.fim} 
                      onChange={(e) => setEditBaseline({ ...editBaseline, fim: e.target.value })}
                      disabled={isBlocked}
                    />
                  </div>
                  <Button 
                    variant="outline"
                    className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                    disabled={isBlocked || (editBaseline.inicio === projetoData.baselineData?.inicio && editBaseline.fim === projetoData.baselineData?.fim)}
                    onClick={() => {
                      const temDataAntiga = !!(projetoData.baselineData?.inicio || projetoData.baselineData?.fim);
                      
                      const performUpdate = (just: string) => {
                        // Validação: Data Fim do projeto deve respeitar a tarefa mais longe
                        if (tarefas && tarefas.length > 0) {
                          const datasFimTarefas = tarefas
                            .filter(t => t.dataFim)
                            .map(t => new Date(t.dataFim).getTime());
                          
                          if (datasFimTarefas.length > 0) {
                            const maiorDataFimTarefa = Math.max(...datasFimTarefas);
                            const novaDataFimProjeto = new Date(editBaseline.fim).getTime();

                            if (novaDataFimProjeto < maiorDataFimTarefa) {
                              const dataMinima = new Date(maiorDataFimTarefa).toLocaleDateString('pt-BR');
                              toast.error(`A data fim do projeto não pode ser anterior à última tarefa (${dataMinima}).`);
                              return;
                            }
                          }
                        }

                        fetch(`/api/projects/${params.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ 
                            action: "update_baseline", 
                            inicio: editBaseline.inicio, 
                            fim: editBaseline.fim, 
                            justificativa: just, 
                            user: usuario?.nome, 
                            papel: usuario?.papel 
                          })
                        }).then(() => {
                          toast.success("Cronograma atualizado com sucesso!");
                          loadData();
                        });
                      };

                      if (temDataAntiga) {
                        setJustificativaDialog({
                          isOpen: true,
                          title: "Confirmar Repactuação de Cronograma",
                          description: `Você está alterando o cronograma oficial da iniciativa. Por favor, justifique esta repactuação:`,
                          value: "",
                          onConfirm: performUpdate
                        });
                      } else {
                        performUpdate("Definição inicial de cronograma");
                      }
                    }}
                  >
                    <Save className="mr-2 h-4 w-4" /> Salvar Cronograma
                  </Button>
                  <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded border max-w-[200px]">
                    Alterações em cronograma existente exigem justificativa e geram repactuação.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Status da Iniciativa</CardTitle></CardHeader>
                <CardContent className="flex items-end gap-6">
                  <div className="flex-[2] space-y-2">
                    <Label>Fase Atual</Label>
                    <Select value={projetoStatus} onValueChange={setProjetoStatus}>
                      <SelectTrigger><SelectValue placeholder="Selecione a fase..."/></SelectTrigger>
                      <SelectContent>
                        {FASES.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Evolução Atual</Label>
                    <div className="h-10 flex items-center px-3 border rounded-md bg-slate-50 text-slate-700 font-bold text-sm">
                      {projetoData.progress}%
                    </div>
                  </div>
                  <Button onClick={handleSaveStatusGeral} className="bg-emerald-600 hover:bg-emerald-700"><Save className="mr-2 h-4 w-4"/> Gravar</Button>
                </CardContent>
              </Card>

              {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-blue-200 bg-blue-50/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                        <UserPlus className="h-5 w-5" /> Atribuição de Responsável
                      </CardTitle>
                      <CardDescription>Defina quem será o responsável por esta iniciativa.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-end gap-4">
                      <div className="flex-1 space-y-2">
                        <Label>Selecionar Usuário</Label>
                        <Select 
                          value={usuariosDisponiveis.find(u => u.nome === projetoData.responsavel)?.id || ""} 
                          onValueChange={handleUpdateResponsavel}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Selecione um colaborador..." />
                          </SelectTrigger>
                          <SelectContent>
                            {usuariosDisponiveis.map(u => (
                              <SelectItem key={u.id} value={u.id}>{u.nome} ({u.cargo})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {isAdminTotal && (
                    <Card className="border-purple-200 bg-purple-50/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
                          <RotateCcw className="h-5 w-5" /> Alterar Diretoria
                        </CardTitle>
                        <CardDescription>Transfira este projeto para outro departamento.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-end gap-4">
                        <div className="flex-1 space-y-2">
                          <Label>Nova Diretoria</Label>
                          <Select 
                            value={projetoData.departamento} 
                            onValueChange={(val) => {
                              if (val === projetoData.departamento) return;
                              setJustificativaDialog({
                                isOpen: true,
                                title: "Alterar Diretoria do Projeto",
                                description: `Você está movendo o projeto de "${projetoData.departamento}" para "${val}". Isso mudará quem tem acesso ao projeto. Justifique:`,
                                value: "",
                                onConfirm: async (just) => {
                                  try {
                                    const res = await fetch(`/api/projects/${params.id}`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        action: "update_diretoria",
                                        novoDept: val,
                                        justificativa: just,
                                        user: usuario?.nome,
                                        papel: usuario?.papel,
                                        dept: usuario?.departamento
                                      })
                                    });
                                    if (res.ok) {
                                      toast.success("Diretoria atualizada!");
                                      loadData();
                                    }
                                  } catch { toast.error("Erro ao alterar diretoria"); }
                                }
                              });
                            }}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Diretoria de Tecnologia da Informação">Diretoria de Tecnologia da Informação</SelectItem>
                              <SelectItem value="Diretoria de Fiscalização de Trânsito">Diretoria de Fiscalização de Trânsito</SelectItem>
                              <SelectItem value="Diretoria de Veículos Automotores">Diretoria de Veículos Automotores</SelectItem>
                              <SelectItem value="Diretoria Administrativa">Diretoria Administrativa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Estrutura Analítica do Projeto (EAP)</CardTitle>
                  <CardDescription>Hierarquize tarefas e atribua responsabilidades.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                    <div className="md:col-span-2 space-y-2">
                      <Label>Título da Tarefa</Label>
                      <Input placeholder="O que precisa ser feito?" value={novaTarefa.titulo} onChange={e => setNovaTarefa({...novaTarefa, titulo: e.target.value})}/>
                    </div>
                    <div className="space-y-2">
                      <Label>Responsável</Label>
                      <Input placeholder="Nome" value={novaTarefa.responsavel} onChange={e => setNovaTarefa({...novaTarefa, responsavel: e.target.value})}/>
                    </div>
                    <div className="space-y-2">
                      <Label>Hierarquia (Parent)</Label>
                      <Select value={novaTarefa.parentId} onValueChange={val => setNovaTarefa({...novaTarefa, parentId: val})}>
                        <SelectTrigger><SelectValue placeholder="Raiz"/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Raiz (Nível 1)</SelectItem>
                          {tarefas.map(t => <SelectItem key={t.id} value={t.id}>{t.titulo}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Data Início</Label>
                      <Input type="date" value={novaTarefa.dataInicio} onChange={e => setNovaTarefa({...novaTarefa, dataInicio: e.target.value})}/>
                    </div>
                    <div className="space-y-2">
                      <Label>Data Fim</Label>
                      <Input type="date" value={novaTarefa.dataFim} onChange={e => setNovaTarefa({...novaTarefa, dataFim: e.target.value})}/>
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <Button onClick={() => handleAdicionarTarefa()} className="w-full bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4"/> Criar Tarefa</Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {tarefas.filter(t => !t.parentId || t.parentId === "none").map(t => renderTarefaRow(t))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="h-[600px] flex flex-col border-blue-100">
                <CardHeader className="bg-blue-50/50 pb-4">
                  <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-blue-600"/> Assistente IA</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {aiMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-lg text-xs ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{m.content}</div>
                    </div>
                  ))}
                  {isAiLoading && <div className="text-xs text-slate-400 animate-pulse">Assistente escrevendo...</div>}
                </CardContent>
                <CardFooter className="p-4 border-t gap-2">
                  <Input placeholder="Pergunte algo..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendAiMessage()}/>
                  <Button size="icon" onClick={handleSendAiMessage}><Send className="h-4 w-4"/></Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </TabsContent>

        <TabsContent value="gantt">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gráfico de Gantt</CardTitle>
                <CardDescription>Clique em uma linha para criar uma subtarefa.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="flex bg-slate-50 border-b">
                  <div className="w-64 p-3 font-semibold border-r">Tarefa / EAP</div>
                  <div className="flex-1 grid grid-cols-12 text-center text-[10px] font-bold p-3 uppercase">
                    {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map(m => <div key={m}>{m}</div>)}
                  </div>
                </div>
                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {getSortedTarefas(tarefas).map(t => {
                    const hoje = new Date();
                    hoje.setHours(0,0,0,0);
                    const dataFimTarefa = t.dataFim ? new Date(t.dataFim) : null;
                    const emAtraso = dataFimTarefa && dataFimTarefa < hoje && t.progress < 100;

                    return (
                      <div 
                        key={t.id} 
                        className="flex h-14 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-all relative group cursor-pointer"
                        onClick={() => setSubTarefaModal({ isOpen: true, parentId: t.id, parentTitle: t.titulo })}
                      >
                        <div className="w-64 p-3 text-sm truncate border-r bg-white/50 dark:bg-transparent group-hover:bg-transparent z-10 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2" style={{ paddingLeft: `${getTaskDepth(t.id, tarefas) * 20 + 12}px` }}>
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          <span className="truncate">{t.titulo}</span>
                          <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity ml-auto" />
                        </div>
                        <div className="flex-1 relative bg-slate-50/30 grid grid-cols-12 divide-x divide-slate-100">
                          {Array.from({length: 12}).map((_, i) => <div key={i}/>)}
                          {t.dataInicio && t.dataFim && (
                            <div 
                              className={`absolute top-3 h-6 rounded shadow-sm transition-transform hover:scale-[1.02] ${t.impedimentoAtivo ? 'bg-rose-100' : emAtraso ? 'bg-orange-200' : (FASES.find(f => f.id === t.status)?.color || 'bg-slate-400')}`}
                              title={`Tarefa: ${t.titulo}\nInício: ${formatarDataBR(t.dataInicio)}\nFim: ${formatarDataBR(t.dataFim)}\nProgresso: ${t.progress}% ${t.impedimentoAtivo ? `(BLOQUEADA: ${t.motivoImpedimento})` : emAtraso ? '(ATRASADA)' : ''}`}
                              style={{ 
                                left: `${(new Date(t.dataInicio).getMonth() / 12) * 100}%`,
                                width: `${((new Date(t.dataFim).getMonth() - new Date(t.dataInicio).getMonth() + 1) / 12) * 100}%`
                              }}
                            >
                              <div className="h-full bg-black/20" style={{ width: `${t.progress}%` }}/>
                              {t.impedimentoAtivo && (
                                <div className="absolute h-full bg-black right-0" style={{ width: `${100 - t.progress}%`, borderRadius: '0 4px 4px 0' }} />
                              )}
                              {(emAtraso || t.impedimentoAtivo) && <div className={`absolute inset-0 border-2 ${t.impedimentoAtivo ? 'border-black' : 'border-orange-500'} rounded animate-pulse pointer-events-none`}/>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modal de Criação Rápida via Gantt */}
          <Dialog open={subTarefaModal.isOpen} onOpenChange={(open) => setSubTarefaModal(prev => ({ ...prev, isOpen: open }))}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  Nova Subtarefa
                </DialogTitle>
                <DialogDescription>
                  Adicionando subtarefa vinculada a: <span className="font-bold text-slate-900">{subTarefaModal.parentTitle}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Título da Subtarefa</Label>
                  <Input 
                    placeholder="Ex: Revisão de documentos" 
                    value={novaSubTarefa.titulo} 
                    onChange={e => setNovaSubTarefa({...novaSubTarefa, titulo: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Input 
                    placeholder="Nome do responsável" 
                    value={novaSubTarefa.responsavel} 
                    onChange={e => setNovaSubTarefa({...novaSubTarefa, responsavel: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input 
                      type="date" 
                      value={novaSubTarefa.dataInicio} 
                      onChange={e => setNovaSubTarefa({...novaSubTarefa, dataInicio: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Input 
                      type="date" 
                      value={novaSubTarefa.dataFim} 
                      onChange={e => setNovaSubTarefa({...novaSubTarefa, dataFim: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSubTarefaModal(prev => ({ ...prev, isOpen: false }))}>Cancelar</Button>
                <Button onClick={handleCreateSubTarefaGantt} className="bg-blue-600 hover:bg-blue-700">Criar Subtarefa</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="impedimentos">
          {isBlocked ? (
            <div className="rounded-lg border border-dashed border-rose-200 bg-rose-50/40 p-10 text-center">
              <Lock className="h-8 w-8 text-rose-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-rose-700">Registro de impedimentos desabilitado para projetos excluídos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-l-4 border-l-rose-500">
                <CardHeader><CardTitle>Reportar Impedimento</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tarefa Bloqueada</Label>
                    <Select value={impedimentoData.tarefaId} onValueChange={val => setImpedimentoData({...impedimentoData, tarefaId: val})}>
                      <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                      <SelectContent>
                        {tarefas.filter(t => !t.impedimentoAtivo).map(t => <SelectItem key={t.id} value={t.id}>{t.titulo}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Motivo do Bloqueio</Label>
                    <Textarea value={impedimentoData.motivo} onChange={e => setImpedimentoData({...impedimentoData, motivo: e.target.value})}/>
                  </div>
                  <Button onClick={handleSaveImpedimento} className="w-full bg-rose-600 hover:bg-rose-700">Bloquear Tarefa</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Bloqueios Ativos</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {tarefas.filter(t => t.impedimentoAtivo).map(t => (
                    <div key={t.id} className="p-4 bg-rose-50 border border-rose-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-rose-800">{t.titulo}</h4>
                          <p className="text-[10px] text-rose-600 uppercase font-black tracking-tight">Tarefa Bloqueada</p>
                        </div>
                        <Button variant="outline" size="sm" className="border-rose-300 text-rose-700 hover:bg-rose-100" onClick={() => handleResolverImpedimento(t.id)}>Resolver</Button>
                      </div>
                      <div className="p-2 bg-white rounded border border-rose-100">
                        <p className="text-[11px] font-semibold text-rose-900 mb-1">Motivo do Bloqueio:</p>
                        <p className="text-xs text-rose-700 italic">"{t.motivoImpedimento}"</p>
                      </div>
                      <p className="text-[10px] text-rose-400 italic text-right">Responsável: {t.responsavel}</p>
                    </div>
                  ))}
                  {tarefas.filter(t => t.impedimentoAtivo).length === 0 && <p className="text-sm text-slate-500 text-center py-10">Nenhum impedimento ativo.</p>}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader><CardTitle>Auditoria</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-6">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-4 border-b pb-4 last:border-0">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><History className="h-4 w-4 text-slate-400"/></div>
                    <div>
                      <p className="text-sm font-semibold">{log.acao}</p>
                      <p className="text-xs text-slate-500">{log.user} em {log.data}</p>
                      {log.justificativa && <p className="mt-2 text-xs italic bg-slate-50 p-2 rounded">"{log.justificativa}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AlertDialog para Repactuação de Datas */}
      <AlertDialog open={repactuacaoData.isOpen} onOpenChange={(open) => setRepactuacaoData(prev => ({...prev, isOpen: open}))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Alerta de Repactuação
            </AlertDialogTitle>
            <AlertDialogDescription>
              {repactuacaoData.mensagem}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRepactuacaoData(prev => ({...prev, isOpen: false}))}>Não</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (repactuacaoData.tarefaId === "NEW_TASK") {
                  handleAdicionarTarefa(true, repactuacaoData.updates);
                } else {
                  handleUpdateTarefa(repactuacaoData.tarefaId, repactuacaoData.updates, true);
                }
                setRepactuacaoData(prev => ({...prev, isOpen: false}));
              }}
            >
              Repactuar e Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Lançamentos e Anotações */}
      <Dialog open={!!selectedTarefaParaNotas} onOpenChange={(open) => !open && setSelectedTarefaParaNotas(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Lançamentos: {selectedTarefaParaNotas?.titulo}
            </DialogTitle>
            <DialogDescription>
              Registre observações, anexe arquivos ou cole imagens.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
            {/* Campo de Novo Lançamento */}
            {!isBlocked && (
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border">
                <Textarea 
                  placeholder="Digite sua anotação aqui... (Dica: você pode colar imagens diretamente)" 
                  className="min-h-[80px] bg-white text-sm"
                  value={novoLancamento}
                  onChange={(e) => setNovoLancamento(e.target.value)}
                  onPaste={handlePasteImage}
                />
                
                {arquivoAnexo && (
                  <div className="relative w-20 h-20 border rounded overflow-hidden bg-white">
                    <img src={arquivoAnexo} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setArquivoAnexo(null)}
                      className="absolute top-0 right-0 bg-rose-500 text-white rounded-bl p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="file-upload" className="cursor-pointer flex items-center gap-1.5 px-2 py-1 text-[10px] bg-white border rounded hover:bg-slate-50 transition-colors">
                      <Plus className="h-3 w-3" /> Anexar Arquivo
                    </Label>
                    <input 
                      id="file-upload" 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => setArquivoAnexo(event.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700" onClick={handleAddLancamento}>
                    Publicar
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de Lançamentos */}
            <div className="space-y-4">
              {selectedTarefaParaNotas?.lancamentos?.map((l: any) => (
                <div key={l.id} className="p-3 border rounded-lg space-y-2 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="text-[11px] font-bold">{l.user}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{l.data}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {l.texto}
                  </p>
                  {l.arquivoUrl && (
                    <div className="mt-2 border rounded p-1 inline-block bg-slate-50">
                      {l.arquivoUrl.startsWith('data:image') ? (
                        <img src={l.arquivoUrl} alt="Anexo" className="max-w-full max-h-[300px] rounded" />
                      ) : (
                        <div className="flex items-center gap-2 p-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="text-[10px]">Arquivo Anexo</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {(!selectedTarefaParaNotas?.lancamentos || selectedTarefaParaNotas.lancamentos.length === 0) && (
                <div className="text-center py-10">
                  <MessageSquare className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Nenhum lançamento registrado até o momento.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
