import { NextResponse } from 'next/server';
import { getProjetoById, renameProjeto, deleteProjeto, restoreProjeto, addLogToProjeto, createLog, updateBaseline, updateTarefas, updateProjetoStatus, updateEscopo, updateResponsavel, updateProjetoDepartamento } from '@/lib/db';

export async function GET(request: Request, context: any) {
  try {
    const { searchParams } = new URL(request.url);
    const userDept = searchParams.get('dept') || undefined;
    const papel = searchParams.get('role') || undefined;

    const params = await context.params;
    const id = parseInt(params.id);
    const projeto = getProjetoById(id, userDept, papel);
    return NextResponse.json(projeto);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Acesso negado" }, { status: 403 });
  }
}

export async function PUT(request: Request, context: any) {
  try {
    const params = await context.params;
    const id = parseInt(params.id);
    
    const body = await request.json();
    const { action, nome, justificativa, user, papel, dept } = body;

    // Carrega o projeto para verificar permissões básicas
    const projetoAtual = getProjetoById(id, dept, papel);
    
    const isPowerUser = papel === "admin_total" || papel === "admin_master" || papel === "usuario_master";
    const isAdmin = papel === "admin_total" || papel === "admin_master";

    // Regra: projeto excluído só aceita edições por admins ou ação de 'restore'
    if (projetoAtual.excluido && !isAdmin) {
      if (action !== "restore") {
        return NextResponse.json(
          { error: "Este projeto está excluído. Reative-o primeiro ou contate um Admin." },
          { status: 403 }
        );
      }
    }

    // Se a ação for restore, apenas admins podem fazer
    if (action === "restore" && !isAdmin) {
      return NextResponse.json(
        { error: "Você não tem permissão para reativar projetos." },
        { status: 403 }
      );
    }

    if (action === "restore") {
      if (!justificativa) return NextResponse.json({ error: "Justificativa obrigatória" }, { status: 400 });
      restoreProjeto(id, justificativa, user || "Usuário");
      return NextResponse.json({ success: true });
    }

    if (action === "update_diretoria") {
      const { novoDept } = body;
      if (papel !== "admin_total") return NextResponse.json({ error: "Apenas Admin Total pode alterar Diretorias" }, { status: 403 });
      if (!novoDept) return NextResponse.json({ error: "Nova Diretoria é obrigatória" }, { status: 400 });
      const proj = updateProjetoDepartamento(id, novoDept, justificativa || "Alteração Organizacional", user || "Usuário");
      return NextResponse.json(proj);
    }

    if (action === "add_log") {
      const { acao } = body;
      if (!acao) return NextResponse.json({ error: "Ação é obrigatória" }, { status: 400 });
      addLogToProjeto(id, createLog(acao, justificativa || "Sem justificativa", user || "Usuário"));
      return NextResponse.json({ success: true });
    }

    if (action === "update_baseline") {
      const { inicio, fim } = body;
      const proj = updateBaseline(id, inicio || "", fim || "", justificativa || "Ajuste de Cronograma", user || "Usuário");
      return NextResponse.json(proj);
    }

    if (action === "update_tarefas") {
      const { tarefas, user } = body;
      if (!tarefas) return NextResponse.json({ error: "Lista de tarefas é obrigatória" }, { status: 400 });
      const proj = updateTarefas(id, tarefas, user || "Usuário");
      return NextResponse.json(proj);
    }

    if (action === "update_status") {
      const { status, user } = body;
      if (!status) return NextResponse.json({ error: "Status é obrigatório" }, { status: 400 });
      const proj = updateProjetoStatus(id, status, justificativa || "Atualização de status", user || "Usuário");
      return NextResponse.json(proj);
    }

    if (action === "update_responsavel") {
      const { responsavelId, responsavelNome, user: currentUser } = body;
      if (!responsavelId || !responsavelNome) return NextResponse.json({ error: "Responsável é obrigatório" }, { status: 400 });
      const proj = updateResponsavel(id, responsavelId, responsavelNome, currentUser || "Usuário");
      return NextResponse.json(proj);
    }

    if (action === "update_escopo") {
      const { escopo, user } = body;
      if (escopo === undefined) return NextResponse.json({ error: "Escopo é obrigatório" }, { status: 400 });
      const proj = updateEscopo(id, escopo, user || "Usuário");
      return NextResponse.json(proj);
    }

    // Default action é rename
    if (!nome || !justificativa) {
      return NextResponse.json({ error: "Nome e justificativa são obrigatórios" }, { status: 400 });
    }
    
    const projetoEditado = renameProjeto(id, nome, justificativa, user || "Usuário");
    return NextResponse.json(projetoEditado);
  } catch (error: any) {
    if (error.message && error.message.includes("já existe")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error(`Erro na rota PUT de projetos:`, error);
    return NextResponse.json({ error: "Falha interna na operação do projeto" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const params = await context.params;
    const id = parseInt(params.id);
    
    // Ler o corpo do DELETE para capturar a justificativa
    const body = await request.json();
    const { justificativa, user } = body;

    if (!justificativa) {
      return NextResponse.json({ error: "Justificativa obrigatória para exclusão" }, { status: 400 });
    }

    deleteProjeto(id, justificativa, user || "Usuário");
    return new NextResponse(null, { status: 204 }); 
  } catch (error: any) {
    console.error(`Erro ao excluir projeto:`, error);
    return NextResponse.json({ error: "Falha ao excluir o projeto" }, { status: 500 });
  }
}
