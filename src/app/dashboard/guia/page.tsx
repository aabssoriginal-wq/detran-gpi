"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, Info, ShieldCheck, TrendingUp, History, 
  HelpCircle, Sparkles, LayoutList, Lock, User 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SECOES = [
  {
    id: "perfil",
    titulo: "Hierarquia e Perfis",
    icon: ShieldCheck,
    color: "text-blue-600",
    conteudo: [
      { t: "Admin Total", d: "Visão global e absoluta. Único perfil que pode impersonar outros usuários e gerenciar todos os departamentos." },
      { t: "Admin Master", d: "Gestor de uma Diretoria específica. Visão total da sua unidade, mas isolado de outras Diretorias." },
      { t: "Usuário Master", d: "Gestor operacional. Acesso ao Super Gantt e ferramentas de gestão, mas com restrições de criação global." },
      { t: "Usuário", d: "Perfil operacional. Focado na execução de tarefas atribuídas e consulta de projetos do seu departamento." }
    ]
  },
  {
    id: "evolucao",
    titulo: "Regras de Evolução",
    icon: TrendingUp,
    color: "text-emerald-600",
    conteudo: [
      { t: "Cálculo de Progresso", d: "O progresso global do projeto é a média ponderada do progresso de suas tarefas. Tarefas concluídas (100%) impulsionam a barra de progresso geral." },
      { t: "Proporcionalidade", d: "O sistema avalia a saúde do projeto comparando o progresso realizado com o tempo decorrido desde a data de início da Baseline." },
      { t: "Sinalização de Saúde", d: "Verde (No Prazo), Amarelo (Em Risco/Atraso Leve), Vermelho (Atraso Crítico) e Preto (Bloqueio por Impedimento)." }
    ]
  },
  {
    id: "repactuacao",
    titulo: "Repactuação de Cronograma",
    icon: History,
    color: "text-amber-600",
    conteudo: [
      { t: "Justificativa Obrigatória", d: "Qualquer alteração nas datas oficiais do projeto (Baseline) exige uma justificativa detalhada para fins de auditoria." },
      { t: "Extensão Automática", d: "Se uma tarefa for criada ou editada para além do prazo do projeto, o sistema oferecerá a repactuação automática do cronograma global." },
      { t: "Integridade", d: "A data fim do projeto nunca pode ser anterior à data da tarefa mais tardia da EAP." }
    ]
  },
  {
    id: "impedimentos",
    titulo: "Gestão de Impedimentos",
    icon: Lock,
    color: "text-rose-600",
    conteudo: [
      { t: "Bloqueio de Tarefa", d: "Ao reportar um impedimento, a tarefa é travada e sinalizada como 'Bloqueada'." },
      { t: "Impacto no Gantt", d: "A parte remanescente da tarefa bloqueada é exibida em COR PRETA no gráfico de Gantt, indicando interrupção de fluxo." },
      { t: "Resolução", d: "Para destravar uma tarefa, o gestor deve fornecer uma justificativa de resolução que fica gravada no histórico." }
    ]
  },
  {
    id: "ia",
    titulo: "Inteligência Artificial",
    icon: Sparkles,
    color: "text-purple-600",
    conteudo: [
      { t: "Console IA", d: "Utilize o console para criar projetos inteiros a partir de descrições em linguagem natural." },
      { t: "Criação em Lote", d: "O sistema é capaz de processar e criar múltiplos projetos simultaneamente via prompt." },
      { t: "Contexto", d: "A IA do projeto individual conhece todo o histórico e escopo da iniciativa, servindo como um assistente de decisão." }
    ]
  }
];

export default function GuiaPage() {
  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
          <BookOpen className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Guia do Sistema GPI</h1>
          <p className="text-slate-500">Regras de negócio, governança e manuais de operação atualizados.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECOES.map((secao) => (
          <Card key={secao.id} className="border-none shadow-md bg-white hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center gap-2 ${secao.color}`}>
                <secao.icon className="h-5 w-5" />
                {secao.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {secao.conteudo.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-slate-300" />
                      {item.t}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed pl-3 border-l border-slate-100 ml-0.5">
                      {item.d}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-8 text-center">
          <HelpCircle className="h-10 w-10 text-slate-300 mb-4" />
          <h3 className="font-bold text-slate-700">Dúvidas Adicionais?</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-[250px]">
            Se você não encontrou a resposta aqui, utilize o Assistente IA no Console ou contate o administrador do sistema.
          </p>
          <Badge variant="outline" className="mt-4 border-slate-300 text-slate-500">Versão 2.5.0 - Atualizado em Abr/2026</Badge>
        </Card>
      </div>

      <div className="bg-blue-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="relative z-10 space-y-2">
          <h2 className="text-2xl font-bold">Pronto para começar?</h2>
          <p className="text-blue-100 max-w-md">O sistema GPI foi desenhado para ser intuitivo, mas a governança rigorosa garante a segurança de todos os departamentos do DETRAN-SP.</p>
        </div>
        <LayoutList className="absolute right-[-20px] bottom-[-20px] h-48 w-48 text-blue-500/20 rotate-12" />
      </div>
    </div>
  );
}
