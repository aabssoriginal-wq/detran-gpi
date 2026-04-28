import { NextResponse } from 'next/server';
import { getProjetos, createProjeto } from '@/lib/db';
import { getUsuarios } from '@/lib/users';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userDept = searchParams.get('dept') || undefined;
    const papel = searchParams.get('role') || undefined;
    const userName = searchParams.get('userName') || undefined;

    let projetos = getProjetos(userDept || undefined, papel || undefined);
    
    // Regra de Ouro: Se for usuário comum, filtramos por atribuição real no servidor
    if (papel === 'usuario' && userName) {
      const allUsers = getUsuarios();
      const currentUser = allUsers.find(u => u.nome.trim() === userName.trim());
      
      if (currentUser) {
        const IDsAtribuidos = currentUser.projetosAtribuidos || [];
        projetos = projetos.filter(p => 
          IDsAtribuidos.includes(p.id) || 
          (p.responsavel && p.responsavel.trim().toLowerCase() === userName.trim().toLowerCase())
        );
      }
    }

    const summary = projetos.map(({ logs, tarefas, ...rest }) => ({
      ...rest,
      tarefaBloqueada: tarefas?.find(t => t.impedimentoAtivo)?.titulo || null,
      responsavelTecnico: tarefas?.find(t => t.impedimentoAtivo)?.responsavel || null,
      countTarefas: tarefas?.length || 0
    }));
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Erro ao buscar projetos:", error);
    return NextResponse.json({ error: "Falha ao ler banco de dados local" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, responsavel, departamento, dataInicio, dataFim } = body;
    
    if (!nome || !departamento) {
      return NextResponse.json({ error: "Nome e Departamento são obrigatórios" }, { status: 400 });
    }
    
    const novoProjeto = createProjeto(nome, responsavel || "Não Definido", departamento, dataInicio, dataFim);
    return NextResponse.json(novoProjeto, { status: 201 });
  } catch (error: any) {
    if (error.message && error.message.includes("já existe")) {
      return NextResponse.json({ error: error.message }, { status: 409 }); // 409 Conflict
    }
    console.error("Erro ao criar projeto:", error);
    return NextResponse.json({ error: "Falha ao gravar no banco de dados local" }, { status: 500 });
  }
}
