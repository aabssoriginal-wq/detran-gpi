import { NextResponse } from "next/server";
import { getRelatorios } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dept = searchParams.get("dept");
    const role = searchParams.get("role");

    const relatorios = getRelatorios(dept || undefined, role || undefined);
    return NextResponse.json(relatorios);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
