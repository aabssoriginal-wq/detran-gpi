"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FolderKanban, AlertCircle, CheckCircle2, Clock, ShieldAlert, CheckSquare, PlayCircle, User, Loader2, Edit2, Trash2, RefreshCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const getIconComponent = (iconName: string) => {
  switch(iconName) {
    case "CheckCircle2": return CheckCircle2;
    case "AlertCircle": return AlertCircle;
    case "Clock": return Clock;
    case "ShieldAlert": return ShieldAlert;
    case "CheckSquare": return CheckSquare;
    case "FolderKanban": return FolderKanban;
    default: return FolderKanban;
  }
};

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [activeFilter, setActiveFilter] = useState("all");
  const [projetos, setProjetos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para Diálogo de Justificativa (Substituindo window.prompt)
  const [justificativaDialog, setJustificativaDialog] = useState<{
    isOpen: boolean,
    title: string,
    description: string,
    value: string,
    placeholder: string,
    onConfirm: (val: string, extra?: string) => void
  }>({
    isOpen: false,
    title: "",
    description: "",
    value: "",
    placeholder: "",
    onConfirm: () => {}
  });

  const isMaster = usuario?.papel === 'usuario_master' || usuario?.papel === 'admin_master' || usuario?.papel === 'admin_total';

  const formatarDataDisplay = (dataIso?: string) => {
    if (!dataIso || dataIso === "") return "";
    const [year, month, day] = dataIso.split("-");
    if (!day || !month || !year) return "";
    return `${day}/${month}/${year}`;
  };

  const loadProjetos = () => {
    if (!usuario) return;
    setLoading(true);
    // Passar departamento e papel para filtragem no servidor
    const url = `/api/projects?dept=${encodeURIComponent(usuario.departamento)}&role=${usuario.papel}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          setProjetos([]);
          setLoading(false);
          return;
        }
        let filtered = data;
        // Regra Adicional: Usuário Comum vê apenas seus projetos atribuídos (dentro do seu depto)
        if (usuario?.papel === 'usuario') {
          // Se projetosAtribuidos for nulo ou vazio, ele não vê nada ou vê tudo? 
          // Geralmente usuário vê apenas o que lhe é atribuído.
          filtered = data.filter((p: any) => usuario.projetosAtribuidos?.includes(p.id));
        }
        setProjetos(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProjetos();
  }, [usuario]);

  const handleEdit = async (projeto: any) => {
    const novoNome = window.prompt("Digite o novo nome para o projeto:", projeto.nome);
    if (!novoNome || novoNome.trim() === projeto.nome) return;

    setJustificativaDialog({
      isOpen: true,
      title: "Renomear Projeto",
      description: `Alterando nome de "${projeto.nome}" para "${novoNome.trim()}". Por favor, justifique:`,
      value: "",
      placeholder: "Motivo da alteração...",
      onConfirm: async (just) => {
        if (!just.trim()) {
          alert("Justificativa obrigatória.");
          return;
        }
        try {
          const res = await fetch(`/api/projects/${projeto.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              action: "rename", 
              nome: novoNome.trim(), 
              justificativa: just.trim(),
              user: usuario?.nome,
              papel: usuario?.papel
            })
          });
          if (!res.ok) {
            const errorData = await res.json();
            alert(`Erro: ${errorData.error}`);
            return;
          }
          loadProjetos();
        } catch (e) {
          alert("Falha de comunicação.");
        }
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Atenção! Deseja realmente enviar este projeto para a Lixeira?")) return;

    setJustificativaDialog({
      isOpen: true,
      title: "Excluir Projeto",
      description: "O projeto será movido para a lixeira. Justifique a exclusão:",
      value: "",
      placeholder: "Motivo da exclusão...",
      onConfirm: async (just) => {
        if (!just.trim()) {
          alert("Justificativa obrigatória.");
          return;
        }
        try {
          const res = await fetch(`/api/projects/${id}`, { 
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              justificativa: just.trim(),
              user: usuario?.nome,
              papel: usuario?.papel
            })
          });
          if (!res.ok) {
            const errorData = await res.json();
            alert(`Erro: ${errorData?.error || 'Falha ao excluir'}`);
            return;
          }
          loadProjetos();
        } catch (e) {
          alert("Falha de comunicação.");
        }
      }
    });
  };

  const handleRestore = async (id: number) => {
    setJustificativaDialog({
      isOpen: true,
      title: "Restaurar Projeto",
      description: "O projeto voltará para o portfólio ativo. Justifique a restauração:",
      value: "",
      placeholder: "Motivo da restauração...",
      onConfirm: async (just) => {
        if (!just.trim()) {
          alert("Justificativa obrigatória.");
          return;
        }
        try {
          const res = await fetch(`/api/projects/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              action: "restore", 
              justificativa: just.trim(),
              user: usuario?.nome,
              papel: usuario?.papel
            })
          });
          if (!res.ok) {
            const errorData = await res.json();
            alert(`Erro: ${errorData?.error || 'Falha ao restaurar'}`);
            return;
          }
          loadProjetos();
        } catch (e) {
          alert("Falha de comunicação.");
        }
      }
    });
  };

  const { projetosAtivos, projetosExcluidos, totais } = useMemo(() => {
    const ativos = projetos.filter(p => !p.excluido);
    const excluidos = projetos.filter(p => p.excluido);
    const stats = {
      all: ativos.length,
      andamento: ativos.filter(p => p.andamento).length,
      finalizados: ativos.filter(p => !p.andamento).length,
      prazo: ativos.filter(p => p.healthStatus === "prazo" && p.andamento).length,
      risco: ativos.filter(p => p.healthStatus === "risco" && p.andamento).length,
      atrasados: ativos.filter(p => p.healthStatus === "atrasados" && p.andamento).length,
      impedimentos: ativos.filter(p => p.healthStatus === "impedimentos" && p.andamento).length
    };
    return { projetosAtivos: ativos, projetosExcluidos: excluidos, totais: stats };
  }, [projetos]);

  const filteredProjetos = useMemo(() => {
    return projetosAtivos.filter(p => {
      if (activeFilter === "all") return true;
      if (activeFilter === "andamento") return p.andamento;
      if (activeFilter === "finalizados") return !p.andamento;
      if (activeFilter === "prazo") return p.healthStatus === "prazo" && p.andamento;
      if (activeFilter === "risco") return p.healthStatus === "risco" && p.andamento;
      if (activeFilter === "atrasados") return p.healthStatus === "atrasados" && p.andamento;
      if (activeFilter === "impedimentos") return p.healthStatus === "impedimentos" && p.andamento;
      return true;
    });
  }, [projetosAtivos, activeFilter]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Diálogo de Justificativa Reutilizável */}
      <Dialog open={justificativaDialog.isOpen} onOpenChange={(open) => setJustificativaDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{justificativaDialog.title}</DialogTitle>
            <DialogDescription>{justificativaDialog.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Justificativa (Auditoria)</Label>
              <Textarea 
                placeholder={justificativaDialog.placeholder} 
                value={justificativaDialog.value}
                onChange={(e) => setJustificativaDialog(prev => ({ ...prev, value: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setJustificativaDialog(prev => ({ ...prev, isOpen: false }))}>Cancelar</Button>
            <Button 
              onClick={() => {
                justificativaDialog.onConfirm(justificativaDialog.value);
                setJustificativaDialog(prev => ({ ...prev, isOpen: false, value: "" }));
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Visão Geral do Portfólio</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Acompanhamento consolidado de projetos carregados da base de dados.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Status Geral</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card 
            onClick={() => setActiveFilter("all")}
            className={`cursor-pointer transition-all hover:shadow-md border-l-4 border-l-blue-500 ${activeFilter === "all" ? "ring-2 ring-blue-500 shadow-md bg-blue-50/50 dark:bg-blue-900/10" : "shadow-sm"}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total de Projetos</CardTitle>
              <FolderKanban className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{totais.all}</div>
              <p className="text-xs text-slate-500 mt-1">Registrados no sistema</p>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveFilter("andamento")}
            className={`cursor-pointer transition-all hover:shadow-md border-l-4 border-l-indigo-500 ${activeFilter === "andamento" ? "ring-2 ring-indigo-500 shadow-md bg-indigo-50/50 dark:bg-indigo-900/10" : "shadow-sm"}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Em Andamento</CardTitle>
              <PlayCircle className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{totais.andamento}</div>
              <p className="text-xs text-slate-500 mt-1">Projetos ativos</p>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveFilter("finalizados")}
            className={`cursor-pointer transition-all hover:shadow-md border-l-4 border-l-slate-500 ${activeFilter === "finalizados" ? "ring-2 ring-slate-500 shadow-md bg-slate-50/50 dark:bg-slate-800/50" : "shadow-sm"}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Finalizados</CardTitle>
              <CheckSquare className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{totais.finalizados}</div>
              <p className="text-xs text-slate-500 mt-1">Entregues com sucesso</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Saúde do Portfólio (Projetos Ativos)</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            onClick={() => setActiveFilter("prazo")}
            className={`cursor-pointer transition-all hover:shadow-md border-l-4 border-l-emerald-500 ${activeFilter === "prazo" ? "ring-2 ring-emerald-500 shadow-md bg-emerald-50/50 dark:bg-emerald-900/10" : "shadow-sm"}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">No Prazo</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{totais.prazo}</div>
              <p className="text-xs text-slate-500 mt-1">Sem desvios</p>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveFilter("risco")}
            className={`cursor-pointer transition-all hover:shadow-md border-l-4 border-l-amber-500 ${activeFilter === "risco" ? "ring-2 ring-amber-500 shadow-md bg-amber-50/50 dark:bg-amber-900/10" : "shadow-sm"}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Em Risco</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{totais.risco}</div>
              <p className="text-xs text-slate-500 mt-1">Atenção Necessária</p>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveFilter("atrasados")}
            className={`cursor-pointer transition-all hover:shadow-md border-l-4 border-l-rose-500 ${activeFilter === "atrasados" ? "ring-2 ring-rose-500 shadow-md bg-rose-50/50 dark:bg-rose-900/10" : "shadow-sm"}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Atrasados</CardTitle>
              <AlertCircle className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{totais.atrasados}</div>
              <p className="text-xs text-rose-500 mt-1">Fora do Prazo Global</p>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveFilter("impedimentos")}
            className={`cursor-pointer transition-all hover:shadow-md border-l-4 border-l-rose-600 ${activeFilter === "impedimentos" ? "ring-2 ring-rose-600 shadow-md bg-rose-100/50 dark:bg-rose-900/30" : "bg-rose-50/30 dark:bg-rose-950/20 shadow-sm border-rose-200 dark:border-rose-900/50"}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-400">Impedimentos Ativos</CardTitle>
              <ShieldAlert className="h-4 w-4 text-rose-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">{totais.impedimentos}</div>
              <p className="text-xs text-rose-600/80 mt-1">Tarefas bloqueadas</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>
              {activeFilter === "all" && "Todas as Iniciativas Ativas"}
              {activeFilter === "andamento" && "Iniciativas em Andamento"}
              {activeFilter === "finalizados" && "Iniciativas Finalizadas"}
              {activeFilter === "prazo" && "Iniciativas no Prazo"}
              {activeFilter === "risco" && "Iniciativas em Risco"}
              {activeFilter === "atrasados" && "Iniciativas com Atraso Crítico"}
              {activeFilter === "impedimentos" && "Iniciativas com Impedimentos"}
            </CardTitle>
            <CardDescription>
              {filteredProjetos.length} projeto(s) ativo(s) encontrado(s).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {filteredProjetos.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Nenhum projeto encontrado para este filtro.
              </div>
            ) : (
              filteredProjetos.map((projeto) => {
                const Icon = getIconComponent(projeto.icon);
                return (
                  <div key={projeto.id} className="space-y-2 group">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <Link href={`/dashboard/projetos/${projeto.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors">
                            {projeto.nome}
                          </Link>
                          {projeto.departamento && (
                            <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-tighter">
                              {projeto.departamento.replace("Diretoria de ", "")}
                            </span>
                          )}
                          {projeto.responsavel && <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-normal hidden sm:inline-block">({projeto.responsavel})</span>}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isMaster && (
                            <>
                              <button onClick={() => handleEdit(projeto)} className="p-1 text-slate-400 hover:text-blue-500 rounded hover:bg-blue-50" title="Renomear Projeto"><Edit2 className="h-3.5 w-3.5" /></button>
                              <button onClick={() => handleDelete(projeto.id)} className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50" title="Enviar para Lixeira"><Trash2 className="h-3.5 w-3.5" /></button>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`${projeto.iconColor} flex items-center gap-1 font-medium shrink-0 cursor-help`} title={projeto.healthReason}>
                        <Icon className="h-3 w-3"/> <span className="hidden sm:inline-block">{projeto.text}</span>
                      </span>
                    </div>
                    {/* Exibição de Datas do Projeto */}
                    {(projeto.baselineData?.inicio || projeto.baselineData?.fim) && (
                      <div className="flex gap-4 text-[10px] text-slate-400 font-medium mb-1 pl-0">
                        {projeto.baselineData?.inicio && (
                          <span className="flex items-center gap-1">Início: {formatarDataDisplay(projeto.baselineData.inicio)}</span>
                        )}
                        {projeto.baselineData?.fim && (
                          <span className="flex items-center gap-1">Fim: {formatarDataDisplay(projeto.baselineData.fim)}</span>
                        )}
                      </div>
                    )}
                    {activeFilter === "impedimentos" && projeto.healthStatus === "impedimentos" && projeto.tarefaBloqueada && (
                      <div className="bg-rose-50 dark:bg-rose-950/30 p-2 rounded border border-rose-100 dark:border-rose-900/50 mt-2 mb-3 text-xs text-rose-800 dark:text-rose-300">
                        <span className="font-semibold block mb-1">Tarefa Afetada: {projeto.tarefaBloqueada}</span>
                        {projeto.responsavelTecnico && (
                          <span className="flex items-center gap-1 opacity-80 mt-1"><User className="h-3 w-3" /> Responsável Técnico: {projeto.responsavelTecnico}</span>
                        )}
                      </div>
                    )}
                    <Progress 
                      value={projeto.progress} 
                      className={`h-2 cursor-help ${!projeto.andamento ? 'opacity-50' : ''}`} 
                      indicatorColor={projeto.indicator} 
                      title={projeto.healthReason}
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-sm h-fit">
            <CardHeader>
              <CardTitle>Criação Inteligente</CardTitle>
              <CardDescription>Dica: Vá até o Console IA para delegar a criação de projetos ao assistente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 text-center text-sm text-blue-800 dark:text-blue-300">
                A Inteligência Artificial processa <strong>múltiplas</strong> criações ao mesmo tempo. Peça para o Gemini criar vários projetos de uma vez.
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm h-fit border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-slate-500" />
                Lixeira (Projetos Excluídos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projetosExcluidos.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Nenhum projeto na lixeira.</p>
              ) : (
                <div className="space-y-3">
                  {projetosExcluidos.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-sm">
                      <div className="truncate flex-1 max-w-[200px]">
                        <Link href={`/dashboard/projetos/${p.id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline truncate block">
                          {p.nome}
                        </Link>
                      </div>
                      <button 
                        onClick={() => handleRestore(p.id)} 
                        className="p-1.5 ml-2 shrink-0 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-slate-600 hover:text-emerald-600 dark:text-slate-300 rounded transition-colors"
                        title="Restaurar Projeto"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
