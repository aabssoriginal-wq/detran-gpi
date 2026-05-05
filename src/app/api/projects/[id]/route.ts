import { NextResponse } from 'next/server';
import { getProjetoById, renameProjeto, deleteProjeto, restoreProjeto, permanentlyDeleteProjeto, addLogToProjeto, createLog, updateBaseline, updateTarefas, updateProjetoStatus, updateEscopo, updateResponsavel, updateProjetoDepartamento, toggleFavorite, updateContrato, updateRecursos, updateTerceiros } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
    console.log(`API PUT [${action}] - User: ${user} (${papel}) - Project ID: ${id}`);
    
    let finalDept = dept;
    if (!finalDept && user) {
      const fs = require('fs');
      const path = require('path');
      const usersPath = path.join(process.cwd(), 'users.json');
      try {
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        const found = users.find(u => u.nome === user || u.email === user);
        if (found) {
          finalDept = found.departamento;
          console.log(`Dept recuperado do banco para ${user}: [${finalDept}]`);
        }
      } catch (e) {
        console.error("Erro ao recuperar dept do banco:", e);
      }
    }

    // Carrega o projeto para verificar permissões básicas
    const projetoAtual = getProjetoById(id, finalDept, papel);
    console.log(`Projeto encontrado! Dept no banco: [${projetoAtual.departamento}] (len: ${projetoAtual.departamento?.length})`);
    
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

    if (action === "permanently_delete") {
      if (!isAdmin) return NextResponse.json({ error: "Apenas Admin Total ou Admin Master podem excluir permanentemente." }, { status: 403 });
      permanentlyDeleteProjeto(id);
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle_favorite') {
      const { user } = body;
      const updated = toggleFavorite(id, user);
      return NextResponse.json(updated);
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
      const { tarefas, user, acao, justificativa: justUpdate } = body;
      if (!tarefas) return NextResponse.json({ error: "Lista de tarefas é obrigatória" }, { status: 400 });
      const proj = updateTarefas(id, tarefas, user || "Usuário", acao, justUpdate);
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
      
      // 1. Encontrar o responsável antigo para removê-lo (opcional, mas bom para consistência)
      // Nota: o sistema usa 'nome' para o campo responsavel no projeto.
      
      const proj = updateResponsavel(id, responsavelId, responsavelNome, currentUser || "Usuário");
      return NextResponse.json(proj);
    }

    if (action === "update_escopo") {
      const { escopo, escopoDetalhado, user } = body;
      if (escopo === undefined) return NextResponse.json({ error: "Escopo é obrigatório" }, { status: 400 });
      const proj = updateEscopo(id, escopo, user || "Usuário", escopoDetalhado);
      return NextResponse.json(proj);
    }

    if (action === "update_contrato") {
      const { contrato, user } = body;
      const proj = updateContrato(id, contrato, user || "Usuário");
      return NextResponse.json(proj);
    }

    if (action === "update_recursos") {
      const { recursos, user } = body;
      const proj = updateRecursos(id, recursos, user || "Usuário");
      return NextResponse.json(proj);
    }

    if (action === "update_terceiros") {
      const { terceiros, user } = body;
      const proj = updateTerceiros(id, terceiros, user || "Usuário");
      return NextResponse.json(proj);
    }

    // Default action é rename
    if (!nome || !justificativa) {
      if (action) return NextResponse.json({ error: `Ação desconhecida: ${action}` }, { status: 400 });
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
    
    // Ler o corpo do DELETE para capturar a justificativa e papel
    const body = await request.json();
    const { justificativa, user, papel, dept } = body;

    const isAdmin = papel === "admin_total" || papel === "admin_master";
    if (!isAdmin) {
      return NextResponse.json({ error: "Apenas administradores podem excluir projetos." }, { status: 403 });
    }

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
