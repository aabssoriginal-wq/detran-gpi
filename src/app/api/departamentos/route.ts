import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'departamentos.json');

function getDepartamentos() {
  try {
    if (!fs.existsSync(dbPath)) return [];
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (error) {
    console.error('Error reading departamentos:', error);
    return [];
  }
}

function saveDepartamentos(data: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing departamentos:', error);
    return false;
  }
}

export async function GET() {
  const data = getDepartamentos();
  // Sort alphabetically
  data.sort((a: any, b: any) => a.nome.localeCompare(b.nome));
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const { id, nome } = await request.json();
    if (!id || !nome) {
      return NextResponse.json({ error: "ID e Nome são obrigatórios" }, { status: 400 });
    }

    const data = getDepartamentos();
    if (data.find((d: any) => d.id === id || d.nome === nome)) {
      return NextResponse.json({ error: "Departamento já existe" }, { status: 400 });
    }

    data.push({ id, nome });
    saveDepartamentos(data);

    return NextResponse.json({ success: true, departamento: { id, nome } });
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

    let data = getDepartamentos();
    data = data.filter((d: any) => d.id !== id);
    saveDepartamentos(data);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
