import { NextResponse } from 'next/server';
import { getUsuarios, updateUsuarioPapel, updateUsuarioProjetosAtribuidos, addUsuario, removeUsuario, type Papel } from '@/lib/users';
import { getProjetos, updateTarefas, updateResponsavel } from '@/lib/db';

const HIERARCHY = { 'admin_total': 4, 'admin_master': 3, 'usuario_master': 2, 'usuario': 1 };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dept = searchParams.get('dept');
    const role = searchParams.get('role');

    let usuarios = getUsuarios();

    // Regra de Isolamento: Apenas admin_total vê usuários de todas as diretorias.
    // O filtro só é aplicado se os parâmetros forem passados (página de usuários).
    // Na tela de login (sem parâmetros), retornamos todos os usuários.
    if (role && role !== 'admin_total') {
      if (dept) {
        usuarios = usuarios.filter(u => u.departamento === dept);
      }
    }

    return NextResponse.json(usuarios);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, email, cargo, papel, departamento } = body;
    if (!nome || !email || !cargo || !papel || !departamento) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }
    const novo = addUsuario({ nome, email, cargo, papel, departamento });
    return NextResponse.json(novo, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    // Remove usuário dos projetos em que está responsável ou atribuído
    const usuarios = getUsuarios();
    const userParaDeletar = usuarios.find(u => u.id === id);
    if (!userParaDeletar) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const projetos = getProjetos();
    for (const projeto of projetos) {
      let changed = false;
      // 1. Limpar se for o responsável pelo projeto
      if (projeto.responsavel === userParaDeletar.nome) {
        updateResponsavel(projeto.id, '', 'Não Definido', 'Sistema (Remoção de Usuário)');
        changed = true;
      }
      // 2. Limpar tarefas
      const tarefasAtualizadas = projeto.tarefas.map((t: any) => {
        if (t.responsavel === userParaDeletar.nome) {
          changed = true;
          return { ...t, responsavel: '' };
        }
        return t;
      });
      if (changed) {
        updateTarefas(projeto.id, tarefasAtualizadas, 'Sistema (Remoção de Usuário)');
      }
    }

    removeUsuario(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, action, papel, projetosAtribuidos, requesterPapel } = body;

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    if (action === 'update_papel') {
      if (!papel) return NextResponse.json({ error: 'Papel obrigatório' }, { status: 400 });
      
      // Validação Hierárquica
      if (requesterPapel) {
        const myLevel = HIERARCHY[requesterPapel as keyof typeof HIERARCHY] || 0;
        const targetUser = getUsuarios().find(u => u.id === id);
        const currentTargetLevel = HIERARCHY[targetUser?.papel as keyof typeof HIERARCHY] || 0;
        const newTargetLevel = HIERARCHY[papel as keyof typeof HIERARCHY] || 0;

        if (myLevel < 4) {
          if (currentTargetLevel >= myLevel) return NextResponse.json({ error: 'Permissão negada: Usuário alvo tem nível superior ou igual.' }, { status: 403 });
          if (newTargetLevel > myLevel) return NextResponse.json({ error: 'Permissão negada: Não pode atribuir nível superior ao seu.' }, { status: 403 });
        }
      }

      const updated = updateUsuarioPapel(id, papel as Papel);
      return NextResponse.json(updated);
    }

    if (action === 'update_projetos') {
      if (!Array.isArray(projetosAtribuidos)) return NextResponse.json({ error: 'Lista de projetos obrigatória' }, { status: 400 });
      const updated = updateUsuarioProjetosAtribuidos(id, projetosAtribuidos);
      return NextResponse.json(updated);
    }

    if (action === 'add_projeto') {
      const { projetoId } = body;
      if (!projetoId) return NextResponse.json({ error: 'Projeto ID obrigatório' }, { status: 400 });
      const u = getUsuarios().find(x => x.id === id);
      if (u) {
        const novosIds = Array.from(new Set([...u.projetosAtribuidos, parseInt(projetoId)]));
        const updated = updateUsuarioProjetosAtribuidos(id, novosIds);
        return NextResponse.json(updated);
      }
    }

    if (action === 'remove_projeto') {
      const { projetoId } = body;
      if (!projetoId) return NextResponse.json({ error: 'Projeto ID obrigatório' }, { status: 400 });
      const u = getUsuarios().find(x => x.id === id);
      if (u) {
        const novosIds = u.projetosAtribuidos.filter(pid => pid !== parseInt(projetoId));
        const updated = updateUsuarioProjetosAtribuidos(id, novosIds);
        return NextResponse.json(updated);
      }
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
