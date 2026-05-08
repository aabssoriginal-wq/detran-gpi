import { prisma } from './prisma';

export type Papel = 'admin_total' | 'admin_master' | 'usuario_master' | 'usuario';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  avatar: string;
  papel: Papel;
  departamento: string;
  projetosAtribuidos: number[];
}

export const getUsuarios = async (): Promise<Usuario[]> => {
  const data = await prisma.user.findMany({
    orderBy: { nome: 'asc' }
  });
  return data.map(u => ({
    ...u,
    papel: u.papel as Papel,
    avatar: u.avatar || `https://i.pravatar.cc/150?u=${u.id}`
  }));
};

export const getUsuarioById = async (id: string): Promise<Usuario | undefined> => {
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return undefined;
  return {
    ...u,
    papel: u.papel as Papel,
    avatar: u.avatar || `https://i.pravatar.cc/150?u=${u.id}`
  };
};

export const updateUsuarioPapel = async (id: string, papel: Papel): Promise<Usuario> => {
  const u = await prisma.user.update({
    where: { id },
    data: { papel }
  });
  return {
    ...u,
    papel: u.papel as Papel,
    avatar: u.avatar || `https://i.pravatar.cc/150?u=${u.id}`
  };
};

export const updateUsuarioProjetosAtribuidos = async (id: string, projetosAtribuidos: number[]): Promise<Usuario> => {
  const u = await prisma.user.update({
    where: { id },
    data: { projetosAtribuidos }
  });
  return {
    ...u,
    papel: u.papel as Papel,
    avatar: u.avatar || `https://i.pravatar.cc/150?u=${u.id}`
  };
};

export const addUsuario = async (dados: Omit<Usuario, 'id' | 'projetosAtribuidos'>): Promise<Usuario> => {
  const jaExiste = await prisma.user.findUnique({
    where: { email: dados.email.toLowerCase() }
  });
  if (jaExiste) throw new Error(`Já existe um usuário com o e-mail "${dados.email}".`);
  
  const novoId = `u${String(Date.now()).slice(-6)}`;
  const u = await prisma.user.create({
    data: {
      id: novoId,
      nome: dados.nome,
      email: dados.email.toLowerCase(),
      cargo: dados.cargo,
      avatar: dados.avatar || `https://i.pravatar.cc/150?u=${novoId}`,
      papel: dados.papel,
      departamento: dados.departamento,
      projetosAtribuidos: []
    }
  });
  
  return {
    ...u,
    papel: u.papel as Papel,
    avatar: u.avatar || `https://i.pravatar.cc/150?u=${u.id}`
  };
};

export const removeUsuario = async (id: string): Promise<void> => {
  await prisma.user.delete({ where: { id } });
};
