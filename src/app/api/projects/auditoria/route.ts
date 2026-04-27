import { NextResponse } from 'next/server';
import { getAuditoria } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userDept = searchParams.get('dept') || undefined;
    const papel = searchParams.get('role') || undefined;

    const logs = getAuditoria(userDept, papel);
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("Erro ao buscar auditoria:", error);
    return NextResponse.json({ error: "Falha ao ler logs de auditoria" }, { status: 500 });
  }
}
