import fs from 'fs';
import path from 'path';
import packageUsers from '../../users.json';

// No Azure, a raiz do site montada via Run From Package é somente leitura.
const getUsersPath = () => {
  const isAzure = process.env.WEBSITE_INSTANCE_ID !== undefined;
  if (isAzure) {
    const azureDataDir = '/home/site/data';
    if (!fs.existsSync(azureDataDir)) {
      try { fs.mkdirSync(azureDataDir, { recursive: true }); } catch(e) {}
    }
    return path.join(azureDataDir, 'users.json');
  }
  return path.join(process.cwd(), 'users.json');
};

const usersFilePath = getUsersPath();

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
  }
];

let cachedUsuarios: Usuario[] | null = null;
let lastReadTime: number = 0;
const CACHE_TTL = 5000; // 5 seconds

const initUsersDB = () => {
  // Se estiver no Azure, gerenciar persistência e sincronização usando os dados embutidos no build
  if (process.env.WEBSITE_INSTANCE_ID !== undefined) {
    const forceSync = process.env.SYNC_DATA_NOW === 'true';

    if (!fs.existsSync(usersFilePath) || forceSync) {
      try {
        fs.writeFileSync(usersFilePath, JSON.stringify(packageUsers, null, 2));
        console.log("USUÁRIOS SINCRONIZADOS COM SUCESSO A PARTIR DO BUNDLE");
      } catch (e) {
        console.error("Erro ao sincronizar usuários:", e);
      }
    }
  }

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
  try {
    const fileContent = fs.readFileSync(usersFilePath, 'utf-8');
    if (!fileContent || fileContent.trim() === "") {
      throw new Error("Arquivo de usuários vazio");
    }
    const data = JSON.parse(fileContent);
    cachedUsuarios = data;
    lastReadTime = now;
    return data.sort((a: any, b: any) => a.nome.localeCompare(b.nome));
  } catch (e) {
    console.error("Erro ao ler banco de usuários, usando fallback direto do pacote:", e);
    const fallbackData = Array.isArray(packageUsers) ? packageUsers : [...initialUsers];
    return fallbackData.sort((a: any, b: any) => a.nome.localeCompare(b.nome));
  }
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
