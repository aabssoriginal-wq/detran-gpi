import fs from 'fs';
import path from 'path';

const usersFilePath = path.join(process.cwd(), 'users.json');

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

const initialUsers: Usuario[] = [
  {
    id: 'u000',
    nome: 'Anderson',
    email: 'anderson@detran.sp.gov.br',
    cargo: 'Administrador de Sistemas',
    avatar: 'https://i.pravatar.cc/150?img=33',
    papel: 'admin_total',
    departamento: 'Diretoria de Tecnologia da Informação',
    projetosAtribuidos: []
  },
  {
    id: 'u001',
    nome: 'Luiz Wanderley',
    email: 'luiz.wanderley@detran.sp.gov.br',
    cargo: 'Diretor de TI',
    avatar: 'https://i.pravatar.cc/150?img=11',
    papel: 'admin_master',
    departamento: 'Diretoria de Tecnologia da Informação',
    projetosAtribuidos: []
  },
  {
    id: 'u002',
    nome: 'Ana Paula Ferreira',
    email: 'ana.ferreira@detran.sp.gov.br',
    cargo: 'Gerente de Projetos',
    avatar: 'https://i.pravatar.cc/150?img=47',
    papel: 'usuario_master',
    departamento: 'Diretoria de Tecnologia da Informação',
    projetosAtribuidos: []
  },
  {
    id: 'u003',
    nome: 'Carlos Eduardo Lima',
    email: 'carlos.lima@detran.sp.gov.br',
    cargo: 'Analista de Sistemas Sênior',
    avatar: 'https://i.pravatar.cc/150?img=12',
    papel: 'usuario',
    departamento: 'Diretoria de Tecnologia da Informação',
    projetosAtribuidos: [1, 3]
  },
  {
    id: 'u007',
    nome: 'Marcos Silveira',
    email: 'marcos.silveira@detran.sp.gov.br',
    cargo: 'Diretor de Fiscalização',
    avatar: 'https://i.pravatar.cc/150?img=8',
    papel: 'admin_master',
    departamento: 'Diretoria de Fiscalização de Trânsito',
    projetosAtribuidos: []
  },
  {
    id: 'u010',
    nome: 'Beatriz Santos',
    email: 'beatriz.santos@detran.sp.gov.br',
    cargo: 'Usuário Master Veículos',
    avatar: 'https://i.pravatar.cc/150?img=22',
    papel: 'usuario_master',
    departamento: 'Diretoria de Veículos Automotores',
    projetosAtribuidos: []
  }
];

let cachedUsuarios: Usuario[] | null = null;
let lastReadTime: number = 0;
const CACHE_TTL = 5000; // 5 seconds

const initUsersDB = () => {
  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify(initialUsers, null, 2));
  }
};

const saveUsersDB = (usuarios: Usuario[]) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(usuarios, null, 2));
  cachedUsuarios = usuarios;
  lastReadTime = Date.now();
};

export const getUsuarios = (): Usuario[] => {
  const now = Date.now();
  if (cachedUsuarios && (now - lastReadTime < CACHE_TTL)) {
    return cachedUsuarios;
  }

  initUsersDB();
  const data = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));
  cachedUsuarios = data;
  lastReadTime = now;
  return data;
};

export const getUsuarioById = (id: string): Usuario | undefined => {
  return getUsuarios().find(u => u.id === id);
};

export const updateUsuarioPapel = (id: string, papel: Papel): Usuario => {
  const usuarios = getUsuarios();
  const idx = usuarios.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('Usuário não encontrado');
  usuarios[idx].papel = papel;
  saveUsersDB(usuarios);
  return usuarios[idx];
};

export const updateUsuarioProjetosAtribuidos = (id: string, projetosAtribuidos: number[]): Usuario => {
  const usuarios = getUsuarios();
  const idx = usuarios.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('Usuário não encontrado');
  usuarios[idx].projetosAtribuidos = projetosAtribuidos;
  saveUsersDB(usuarios);
  return usuarios[idx];
};

export const addUsuario = (dados: Omit<Usuario, 'id' | 'projetosAtribuidos'>): Usuario => {
  const usuarios = getUsuarios();
  const jaExiste = usuarios.find(u => u.email.toLowerCase() === dados.email.toLowerCase());
  if (jaExiste) throw new Error(`Já existe um usuário com o e-mail "${dados.email}".`);
  const novoId = `u${String(Date.now()).slice(-6)}`;
  const novoUsuario: Usuario = {
    id: novoId,
    nome: dados.nome,
    email: dados.email,
    cargo: dados.cargo,
    avatar: `https://i.pravatar.cc/150?u=${novoId}`,
    papel: dados.papel,
    departamento: dados.departamento,
    projetosAtribuidos: []
  };
  usuarios.push(novoUsuario);
  saveUsersDB(usuarios);
  return novoUsuario;
};

export const removeUsuario = (id: string): void => {
  const usuarios = getUsuarios();
  const idx = usuarios.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('Usuário não encontrado');
  usuarios.splice(idx, 1);
  saveUsersDB(usuarios);
};
