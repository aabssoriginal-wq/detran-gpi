import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Em desenvolvimento, permitir acesso livre (login mocado via localStorage)
  if (process.env.NODE_ENV === "development") {
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
