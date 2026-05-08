import AzureADProvider from "next-auth/providers/azure-ad";
import { prisma } from "./prisma";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "gpi-detran-dev-fallback-secret-12345",
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID || "",
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }: any) {
      if (!user.email) return false;

      const dbUser = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() }
      });

      if (dbUser) {
        return true;
      }

      // Se não encontrar o usuário na base local, bloqueia o acesso (Segurança)
      return false; 
    },
    async session({ session }: any) {
      if (!session.user?.email) return session;

      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase() }
      });

      if (dbUser) {
        session.user.id = dbUser.id;
        session.user.papel = dbUser.papel;
        session.user.departamento = dbUser.departamento;
        session.user.cargo = dbUser.cargo;
        session.user.nome = dbUser.nome;
        session.user.projetosAtribuidos = dbUser.projetosAtribuidos || [];
      }
      return session;
    },
  },
  pages: {
    signIn: '/', // Redireciona para a home se houver erro
  },
};
