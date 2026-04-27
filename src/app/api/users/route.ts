import { NextResponse } from 'next/server';
import { getUsuarios, updateUsuarioPapel, updateUsuarioProjetosAtribuidos, addUsuario, removeUsuario, type Papel } from '@/lib/users';
import { getProjetos, updateTarefas } from '@/lib/db';

export async function GET() {
  try {
    const usuarios = getUsuarios();
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

    // Remove usuário dos projetos em que está atribuído
    const projetos = getProjetos();
    for (const projeto of projetos) {
      const tarefasAtualizadas = projeto.tarefas.map((t: any) => ({
        ...t,
        responsavel: t.responsavel === id ? '' : t.responsavel
      }));
      if (JSON.stringify(tarefasAtualizadas) !== JSON.stringify(projeto.tarefas)) {
        updateTarefas(projeto.id, tarefasAtualizadas);
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
    const { id, action, papel, projetosAtribuidos } = body;

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    if (action === 'update_papel') {
      if (!papel) return NextResponse.json({ error: 'Papel obrigatório' }, { status: 400 });
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
      const usuarios = getUsuarios();
      const u = usuarios.find(x => x.id === id);
      if (u) {
        const novosIds = Array.from(new Set([...u.projetosAtribuidos, parseInt(projetoId)]));
        const updated = updateUsuarioProjetosAtribuidos(id, novosIds);
        return NextResponse.json(updated);
      }
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
