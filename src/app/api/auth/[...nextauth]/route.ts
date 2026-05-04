import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import fs from 'fs';
import path from 'path';

const handler = NextAuth({
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
    async signIn({ user, profile }: any) {
      if (!user.email) return false;

      const usersPath = path.join(process.cwd(), 'users.json');
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      
      const userIndex = users.findIndex((u: any) => u.email.toLowerCase() === user.email.toLowerCase());

      if (userIndex !== -1) {
        // Sincroniza o departamento vindo do Entra ID
        // Nota: O campo 'officeLocation' ou 'department' costuma vir no profile do Azure AD
        const entraDept = profile?.department || profile?.officeLocation || users[userIndex].departamento;
        
        if (entraDept && entraDept !== users[userIndex].departamento) {
          users[userIndex].departamento = entraDept;
          fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        }
        return true;
      }

      // Se não encontrar o usuário na base local, bloqueia o acesso (Segurança)
      // Ou você pode preferir criar um usuário novo aqui.
      return false; 
    },
    async session({ session, token }: any) {
      // Adiciona os dados do users.json na sessão do NextAuth
      const usersPath = path.join(process.cwd(), 'users.json');
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      const dbUser = users.find((u: any) => u.email.toLowerCase() === session.user.email.toLowerCase());

      if (dbUser) {
        session.user.id = dbUser.id;
        session.user.papel = dbUser.papel;
        session.user.departamento = dbUser.departamento;
        session.user.cargo = dbUser.cargo;
        session.user.projetosAtribuidos = dbUser.projetosAtribuidos || [];
      }
      return session;
    },
  },
  pages: {
    signIn: '/', // Redireciona para a home se houver erro
  },
});

export { handler as GET, handler as POST };
