import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Permitir acesso livre em desenvolvimento ou se explicitamente liberado para testes online
  if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ALLOW_MOCK_LOGIN === "true") {
    return NextResponse.next();
  }

  // Em produção, exigir sessão NextAuth válida
  const token = await getToken({ req: request });
  if (!token) {
    const signInUrl = new URL("/", request.url);
    signInUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/projects/:path*",
    "/api/chat/:path*",
    "/api/report/:path*",
  ],
};
