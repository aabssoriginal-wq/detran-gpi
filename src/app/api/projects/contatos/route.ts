import { NextResponse } from 'next/server';
import { getContatosGlobais } from '@/lib/db';

export async function GET() {
  try {
    const contatos = getContatosGlobais();
    return NextResponse.json(contatos);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export const dynamic = 'force-dynamic';
