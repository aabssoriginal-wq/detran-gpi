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
    id: "detalhes",
    titulo: "Detalhes do Projeto",
    icon: LayoutList,
    color: "text-indigo-600",
    conteudo: [
      { t: "Escopo Multinível", d: "Divisão entre Escopo Resumido (350 chars) para visão executiva e Escopo Detalhado (1500 chars) para documentação técnica." },
      { t: "Gestão Contratual", d: "Módulo para registro de Empresa Contratada, Número ESP e Processo SEI vinculados diretamente ao projeto." },
      { t: "Recursos e Terceiros", d: "Cadastro dinâmico de recursos e gestão de contatos de gerentes PRODESP e empresas parceiras." },
      { t: "Banco de Contatos", d: "O sistema replica globalmente contatos de terceiros, sugerindo nomes e e-mails já cadastrados em outros projetos." }
    ]
  },
  {
    id: "evolucao",
    titulo: "Regras de Evolução",
    icon: TrendingUp,
    color: "text-emerald-600",
    conteudo: [
      { t: "Cálculo de Progresso", d: "O progresso global do projeto é a média ponderada do progresso de suas tarefas. Tarefas concluídas (100%) impulsionam a barra de progresso geral." },
      { t: "Sincronização Visual", d: "Ajustes via slider de progresso refletem o valor numérico instantaneamente, garantindo precisão no lançamento." },
      { t: "Sinalização de Saúde", d: "Verde (No Prazo), Amarelo (Em Risco/Atraso Leve), Vermelho (Atraso Crítico) e Preto (Bloqueio por Impedimento)." }
    ]
  },
  {
    id: "repactuacao",
    titulo: "Governança e Auditoria",
    icon: History,
    color: "text-amber-600",
    conteudo: [
      { t: "Logs de Alteração", d: "Qualquer mudança em datas, escopo, contratos ou recursos gera um registro na auditoria com data, hora e usuário." },
      { t: "Justificativa Obrigatória", d: "Mudanças críticas no cronograma (Baseline) ou exclusões de tarefas exigem justificativa para manter a rastreabilidade." },
      { t: "Ordenação Cronológica", d: "O histórico de auditoria é apresentado do registro mais recente para o mais antigo, facilitando a verificação de mudanças." }
    ]
  },
  {
    id: "impedimentos",
    titulo: "Gestão de Impedimentos",
    icon: Lock,
    color: "text-rose-600",
    conteudo: [
      { t: "Bloqueio de Tarefa", d: "Ao reportar um impedimento, a tarefa é travada e sinalizada como 'Bloqueada', impactando visualmente o gráfico de Gantt." },
      { t: "Preto no Gantt", d: "A parte remanescente da tarefa bloqueada é exibida em COR PRETA, indicando interrupção de fluxo." },
      { t: "Resolução", d: "O desbloqueio exige justificativa de resolução, que fica permanentemente gravada no histórico da iniciativa." }
    ]
  },
  {
    id: "ia",
    titulo: "Inteligência Artificial",
    icon: Sparkles,
    color: "text-purple-600",
    conteudo: [
      { t: "Console IA", d: "Crie projetos inteiros ou adicione novas tarefas complexas utilizando descrições em linguagem natural." },
      { t: "Contexto Situacional", d: "A IA do projeto conhece todo o histórico, escopo e impedimentos da iniciativa para auxiliar na tomada de decisão." },
      { t: "Criação em Lote", d: "Capacidade de processar e criar múltiplos projetos simultaneamente via prompt de alto nível." }
    ]
  }
];

export default function GuiaPage() {
  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
          <BookOpen className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Guia do Sistema GPI</h1>
          <p className="text-slate-500 dark:text-slate-400">Regras de negócio, governança e manuais de operação atualizados.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECOES.map((secao) => (
          <Card key={secao.id} className="border-none dark:border dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 hover:shadow-xl transition-all duration-300 group">
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
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                      {item.t}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-3 border-l border-slate-100 dark:border-slate-800 ml-0.5">
                      {item.d}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-8 text-center">
          <HelpCircle className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">Dúvidas Adicionais?</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[250px]">
            Se você não encontrou a resposta aqui, utilize o Assistente IA no Console ou contate o administrador do sistema.
          </p>
          <Badge variant="outline" className="mt-4 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400">Versão 1.1.0 - Atualizado em 05/05/2026</Badge>
        </Card>
      </div>

      <div className="bg-blue-600 dark:bg-blue-700 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="relative z-10 space-y-2">
          <h2 className="text-2xl font-bold">Pronto para começar?</h2>
          <p className="text-blue-100 dark:text-blue-200 max-w-md">O sistema GPI foi desenhado para ser intuitivo, mas a governança rigorosa garante a segurança de todos os departamentos do DETRAN-SP.</p>
        </div>
        <LayoutList className="absolute right-[-20px] bottom-[-20px] h-48 w-48 text-blue-500/20 rotate-12" />
      </div>
    </div>
  );
}
