import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.department.findMany({
      orderBy: { nome: 'asc' }
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Erro ao buscar departamentos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, nome } = await request.json();
    if (!id || !nome) {
      return NextResponse.json({ error: "ID e Nome são obrigatórios" }, { status: 400 });
    }

    const jaExiste = await prisma.department.findFirst({
      where: {
        OR: [
          { id },
          { nome }
        ]
      }
    });

    if (jaExiste) {
      return NextResponse.json({ error: "Departamento já existe" }, { status: 400 });
    }

    const novo = await prisma.department.create({
      data: { id, nome }
    });

    return NextResponse.json({ success: true, departamento: novo });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await prisma.department.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
