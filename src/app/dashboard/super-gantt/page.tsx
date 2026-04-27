"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LayoutList, ListTree, Loader2, Search, User, Clock, ChevronDown, ChevronRight, Filter, ShieldAlert, History, Calendar
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { formatarDataBR } from "@/lib/utils";

export default function SuperGanttPage() {
  const { usuario } = useAuth();
  const [projetos, setProjetos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Record<number, boolean>>({});
  const [expandedRepactuations, setExpandedRepactuations] = useState<Record<number, boolean>>({});
  
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const rightAreaRef = useRef<HTMLDivElement>(null);

  const [filterNome, setFilterNome] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterResp, setFilterResp] = useState("all");
  const [filterDept, setFilterDept] = useState("all");

  useEffect(() => {
    if (!usuario) return;
    setLoading(true);
    fetch(`/api/projects?dept=${encodeURIComponent(usuario.departamento)}&role=${usuario.papel}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const detailedPromises = data.map(p => fetch(`/api/projects/${p.id}?dept=${encodeURIComponent(usuario.departamento)}&role=${usuario.papel}`).then(r => r.json()));
          Promise.all(detailedPromises).then(details => {
            setProjetos(details);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [usuario]);

  // Sync Vertical Scroll
  const handleLeftScroll = () => {
    if (leftColumnRef.current && rightAreaRef.current) {
      rightAreaRef.current.scrollTop = leftColumnRef.current.scrollTop;
    }
  };

  const handleRightScroll = () => {
    if (leftColumnRef.current && rightAreaRef.current) {
      leftColumnRef.current.scrollTop = rightAreaRef.current.scrollTop;
    }
  };

  // Efeito para centralizar no mês atual ao carregar
  useEffect(() => {
    if (!loading && rightAreaRef.current) {
      const today = new Date();
      const startOfTimeline = timelineRange.start;
      const monthDiff = (today.getFullYear() - startOfTimeline.getFullYear()) * 12 + today.getMonth() - startOfTimeline.getMonth();
      const monthWidth = 200; 
      rightAreaRef.current.scrollLeft = monthDiff * monthWidth;
    }
  }, [loading]);

  const toggleProject = (id: number) => {
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRepactuation = (id: number) => {
    setExpandedRepactuations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredProjetos = useMemo(() => {
    return projetos.filter(p => {
      if (p.excluido) return false;
      const matchNome = p.nome.toLowerCase().includes(filterNome.toLowerCase());
      const matchStatus = filterStatus === "all" || p.status === filterStatus;
      const matchResp = filterResp === "all" || p.responsavel === filterResp;
      const matchDept = filterDept === "all" || p.departamento === filterDept;
      return matchNome && matchStatus && matchResp && matchDept;
    });
  }, [projetos, filterNome, filterStatus, filterResp, filterDept]);

  const timelineRange = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 18, 0);
    
    const months = [];
    let curr = new Date(start);
    while (curr <= end) {
      months.push({
        name: curr.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
        start: new Date(curr.getFullYear(), curr.getMonth(), 1),
        end: new Date(curr.getFullYear(), curr.getMonth() + 1, 0)
      });
      curr.setMonth(curr.getMonth() + 1);
    }
    return { months, start, end };
  }, []);

  const calculatePosition = (dateStr?: string) => {
    if (!dateStr) return -1;
    const date = new Date(dateStr);
    if (date < timelineRange.start || date > timelineRange.end) return -1;
    const totalDays = (timelineRange.end.getTime() - timelineRange.start.getTime()) / (1000 * 3600 * 24);
    const daysFromStart = (date.getTime() - timelineRange.start.getTime()) / (1000 * 3600 * 24);
    return (daysFromStart / totalDays) * 100;
  };

  const getStatusBarColor = (p: any) => {
    if (p.status === "concluído") return "bg-emerald-500 border-emerald-600";
    const hoje = new Date();
    const dataFim = p.baselineData?.fim ? new Date(p.baselineData.fim) : null;
    if (dataFim && hoje > dataFim && p.progress < 100) return "bg-rose-500 border-rose-600";
    return "bg-blue-600 border-blue-700";
  };

  const getTaskBarColor = (t: any) => {
    if (t.progress === 100) return "bg-emerald-500";
    if (t.impedimentoAtivo) return "bg-rose-500";
    const hoje = new Date();
    const dataFim = t.dataFim ? new Date(t.dataFim) : null;
    if (dataFim && hoje > dataFim && t.progress < 100) return "bg-amber-500";
    return "bg-slate-400";
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-slate-500 animate-pulse font-medium">Sincronizando cronogramas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-full overflow-hidden px-2">
      <div className="flex items-center gap-2">
        <LayoutList className="h-7 w-7 text-blue-600" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Super Gantt</h1>
      </div>

      {/* Filtros */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardContent className="py-4 flex flex-wrap gap-3">
          <div className="w-[220px] space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Iniciativa</label>
            <Input placeholder="Nome..." className="h-9 text-sm" value={filterNome} onChange={e => setFilterNome(e.target.value)} />
          </div>
          
          {usuario?.papel === 'admin_total' && (
            <div className="w-[200px] space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diretoria</label>
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Diretorias</SelectItem>
                  <SelectItem value="Diretoria de Tecnologia da Informação">TI</SelectItem>
                  <SelectItem value="Diretoria de Fiscalização de Trânsito">Fiscalização</SelectItem>
                  <SelectItem value="Diretoria de Veículos Automotores">Veículos</SelectItem>
                  <SelectItem value="Diretoria Administrativa">Administrativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="w-[140px] space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fase</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Fases</SelectItem>
                <SelectItem value="ideacao">Ideação</SelectItem>
                <SelectItem value="planejamento">Planejamento</SelectItem>
                <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[180px] space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsável</label>
            <Select value={filterResp} onValueChange={setFilterResp}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Líderes</SelectItem>
                {Array.from(new Set(projetos.map(p => p.responsavel).filter(Boolean))).sort().map(r => (
                  <SelectItem key={String(r)} value={String(r)}>{String(r)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="h-9 mt-5 gap-2 text-xs font-bold" onClick={() => {setFilterNome(""); setFilterStatus("all"); setFilterResp("all"); setFilterDept("all");}}>
            <Filter className="h-3 w-3" /> Limpar
          </Button>
        </CardContent>
      </Card>

      {/* Gantt Viewport Único */}
      <Card className="shadow-lg border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
        <div className="flex h-[600px] overflow-hidden">
          
          {/* COLUNA CONGELADA (ESQUERDA) */}
          <div 
            ref={leftColumnRef}
            onScroll={handleLeftScroll}
            className="w-[340px] shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-950 z-20 shadow-md overflow-y-auto scrollbar-hide"
          >
            <div className="h-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 font-black text-[9px] text-slate-400 uppercase tracking-widest sticky top-0 z-30">
              Iniciativas
            </div>
            <div className="flex-1">
              {filteredProjetos.map((p) => {
                const isExpanded = expandedProjects[p.id];
                const isRepactExpanded = expandedRepactuations[p.id];
                const repactuacoes = p.logs?.filter((l: any) => l.acao.includes("Repactuação")) || [];
                const lastRepact = repactuacoes.length > 0 ? repactuacoes[0] : null;

                let datasAntigas = "";
                if (lastRepact) {
                  const matchInicio = lastRepact.acao.match(/\[INÍCIO\]: (.*?) →/);
                  const matchFim = lastRepact.acao.match(/\[FIM\]: (.*?) →/);
                  
                  const partes = [];
                  if (matchInicio) partes.push(`Início: ${matchInicio[1]}`);
                  if (matchFim) partes.push(`Fim: ${matchFim[1]}`);
                  
                  if (partes.length > 0) {
                    datasAntigas = `Datas anteriores: ${partes.join(" | ")}`;
                  }
                }

                return (
                  <div key={p.id} className="border-b border-slate-100 dark:border-slate-800">
                    <div className="h-[90px] px-4 py-3 flex flex-col justify-center gap-1">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleProject(p.id)} className="p-1 hover:bg-slate-50 rounded transition-colors shrink-0">
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-blue-600" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                        </button>
                        {repactuacoes.length > 0 && <Badge className="bg-amber-100 text-amber-700 text-[8px] h-4 px-1.5 font-black">{repactuacoes.length}x</Badge>}
                        <Link href={`/dashboard/projetos/${p.id}`} className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate hover:text-blue-600 transition-colors">
                          {p.nome}
                        </Link>
                      </div>
                      {lastRepact && (
                        <div className="ml-7 mt-1">
                          <button onClick={() => toggleRepactuation(p.id)} className="flex items-center gap-1 text-[7px] font-black text-amber-600 uppercase">
                            <History className="h-2 w-2" /> {isRepactExpanded ? "Ocultar" : "Ver última repactuação"}
                          </button>
                          {isRepactExpanded && (
                            <div className="mt-1 space-y-1">
                              {datasAntigas && <p className="text-[9px] font-bold text-slate-500 flex items-center gap-1"><Calendar className="h-2 w-2" /> {datasAntigas}</p>}
                              <p className="text-[10px] text-amber-700 italic leading-tight border-l-2 border-amber-200 pl-2">"{lastRepact.justificativa}"</p>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="ml-7 mt-1 text-[8px] font-bold text-slate-400 uppercase">{p.responsavel}</div>
                    </div>
                    {isExpanded && p.tarefas.map((t: any) => (
                      <div key={`spacer-${p.id}-${t.id}`} className="h-12 border-t border-slate-50/50" />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ÁREA DE CRONOGRAMA (DIREITA) - Único Scroll Horizontal e Vertical Sincronizado */}
          <div 
            ref={rightAreaRef}
            onScroll={handleRightScroll}
            className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50/30"
            style={{ maxWidth: '1200px' }}
          >
            <div className="w-[4800px] min-h-full flex flex-col relative">
              
              {/* Header dos Meses (Sticky Top) */}
              <div className="h-10 flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0 z-30">
                {timelineRange.months.map((m, i) => (
                  <div key={i} className="h-full border-r border-slate-200 dark:border-slate-800 flex items-center justify-center text-[9px] font-black text-slate-400 uppercase shrink-0" style={{ width: `200px` }}>
                    {m.name}
                  </div>
                ))}
              </div>

              {/* Corpo das Barras */}
              <div className="flex-1 relative">
                {/* Linha de Hoje */}
                <div className="absolute top-0 bottom-0 w-px bg-rose-500/30 z-0" style={{ left: `${calculatePosition(new Date().toISOString())}%` }} />
                
                {filteredProjetos.map((p) => {
                  const isExpanded = expandedProjects[p.id];
                  const startPos = calculatePosition(p.baselineData?.inicio);
                  const endPos = calculatePosition(p.baselineData?.fim);
                  const width = Math.max(0, endPos - startPos);
                  const barColorClass = getStatusBarColor(p);

                  return (
                    <div key={`timeline-${p.id}`} className="border-b border-slate-100 dark:border-slate-800">
                      <div className="h-[90px] flex items-center relative">
                        {startPos >= 0 && width > 0 && (
                          <div 
                            className={`absolute h-6 ${barColorClass} border flex items-center rounded-sm shadow-sm cursor-help`} 
                            style={{ left: `${startPos}%`, width: `${width}%` }} 
                            title={`Iniciativa: ${p.nome}\nInício: ${formatarDataBR(p.baselineData.inicio)}\nFim: ${formatarDataBR(p.baselineData.fim)}\nEvolução: ${p.progress}%`}
                          >
                            <div className="h-full bg-black/10" style={{ width: `${p.progress}%` }} />
                            <span className="absolute left-2 text-[9px] font-black text-black whitespace-nowrap">
                              {p.progress}%
                            </span>
                          </div>
                        )}
                      </div>
                      {isExpanded && p.tarefas.map((t: any) => {
                        const tStart = calculatePosition(t.dataInicio);
                        const tEnd = calculatePosition(t.dataFim);
                        const tWidth = Math.max(0, tEnd - tStart);
                        return (
                          <div key={`task-timeline-${p.id}-${t.id}`} className="h-12 flex items-center relative bg-white/40 border-t border-slate-100/50">
                            {tStart >= 0 && (
                              <div className="absolute z-10 flex items-center gap-1.5 pointer-events-none" style={{ left: `${tStart}%` }}>
                                <span className="text-[10px] font-bold text-slate-500 bg-white/90 px-1 py-0.5 rounded shadow-sm translate-y-[-18px] whitespace-nowrap">{t.titulo}</span>
                              </div>
                            )}
                            {tStart >= 0 && tWidth > 0 && (
                              <div 
                                  className={`absolute h-3 rounded-full ${getTaskBarColor(t)} border border-black/5 shadow-inner cursor-help`} 
                                  style={{ left: `${tStart}%`, width: `${tWidth}%` }} 
                                  title={`Tarefa: ${t.titulo}\nInício: ${formatarDataBR(t.dataInicio)}\nFim: ${formatarDataBR(t.dataFim)}\nEvolução: ${t.progress}%`}
                                >
                                <div className="h-full bg-black/10 rounded-full" style={{ width: `${t.progress}%` }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
