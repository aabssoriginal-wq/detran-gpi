import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Iniciando migração de JSON para PostgreSQL (via Prisma 7 Adapter)...');

  const dataDir = process.cwd();
  
  // 1. Departamentos
  const deptPath = path.join(dataDir, 'departamentos.json');
  if (fs.existsSync(deptPath)) {
    console.log('📦 Migrando Departamentos...');
    const depts = JSON.parse(fs.readFileSync(deptPath, 'utf-8'));
    for (const d of depts) {
      if (!d.id || !d.nome) continue;
      await prisma.department.upsert({
        where: { id: d.id },
        update: { nome: d.nome },
        create: { id: d.id, nome: d.nome },
      });
    }
  }

  // 2. Usuários
  const usersPath = path.join(dataDir, 'users.json');
  if (fs.existsSync(usersPath)) {
    console.log('👥 Migrando Usuários...');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    for (const u of users) {
      if (!u.email) continue;
      await prisma.user.upsert({
        where: { email: u.email.toLowerCase() },
        update: {
          nome: u.nome || 'Sem Nome',
          cargo: u.cargo || 'Não Definido',
          avatar: u.avatar || '',
          papel: u.papel || 'usuario',
          departamento: u.departamento || 'Não Definido',
          projetosAtribuidos: u.projetosAtribuidos || [],
        },
        create: {
          id: u.id || `u${Date.now()}`,
          nome: u.nome || 'Sem Nome',
          email: u.email.toLowerCase(),
          cargo: u.cargo || 'Não Definido',
          avatar: u.avatar || '',
          papel: u.papel || 'usuario',
          departamento: u.departamento || 'Não Definido',
          projetosAtribuidos: u.projetosAtribuidos || [],
        },
      });
    }
  }

  // 3. Projetos, Tarefas e Logs
  const projectsPath = path.join(dataDir, 'data.json');
  if (fs.existsSync(projectsPath)) {
    console.log('🏗️ Migrando Projetos e dependências...');
    const db = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'));
    const projetos = db.projetos || [];
    const relatorios = db.relatorios || [];

    for (const p of projetos) {
      const project = await prisma.project.upsert({
        where: { id: p.id },
        update: {
          nome: p.nome || 'Projeto Sem Nome',
          status: p.status || 'ideacao',
          andamento: p.andamento ?? true,
          progress: p.progress ?? 0,
          text: p.text || '',
          responsavel: p.responsavel || 'Não Definido',
          departamento: p.departamento || 'Não Definido',
          excluido: p.excluido ?? false,
          escopo: p.escopo || '',
          escopoDetalhado: p.escopoDetalhado || '',
          baselineData: p.baselineData || {},
          contrato: p.contrato || {},
          recursos: p.recursos || [],
          terceiros: p.terceiros || {},
          favoritos: p.favoritos || [],
        },
        create: {
          id: p.id,
          nome: p.nome || 'Projeto Sem Nome',
          status: p.status || 'ideacao',
          andamento: p.andamento ?? true,
          progress: p.progress ?? 0,
          text: p.text || '',
          responsavel: p.responsavel || 'Não Definido',
          departamento: p.departamento || 'Não Definido',
          excluido: p.excluido ?? false,
          escopo: p.escopo || '',
          escopoDetalhado: p.escopoDetalhado || '',
          baselineData: p.baselineData || {},
          contrato: p.contrato || {},
          recursos: p.recursos || [],
          terceiros: p.terceiros || {},
          favoritos: p.favoritos || [],
        },
      });

      // Tarefas
      if (p.tarefas && Array.isArray(p.tarefas)) {
        for (const t of p.tarefas) {
          if (!t.id || !t.titulo) continue;
          await prisma.task.upsert({
            where: { id: t.id },
            update: {
              titulo: t.titulo,
              status: t.status || 'pendente',
              progress: t.progress ?? 0,
              responsavel: t.responsavel || '',
              dataInicio: t.dataInicio || '',
              dataFim: t.dataFim || '',
              parentId: t.parentId || null,
              notas: t.notas || '',
              impedimentoAtivo: t.impedimentoAtivo ?? false,
              motivoImpedimento: t.motivoImpedimento || '',
              justificativaResolucao: t.justificativaResolucao || '',
              responsavelTecnico: t.responsavelTecnico || '',
              lancamentos: t.lancamentos || [],
              projectId: project.id,
            },
            create: {
              id: t.id,
              titulo: t.titulo,
              status: t.status || 'pendente',
              progress: t.progress ?? 0,
              responsavel: t.responsavel || '',
              dataInicio: t.dataInicio || '',
              dataFim: t.dataFim || '',
              parentId: t.parentId || null,
              notas: t.notas || '',
              impedimentoAtivo: t.impedimentoAtivo ?? false,
              motivoImpedimento: t.motivoImpedimento || '',
              justificativaResolucao: t.justificativaResolucao || '',
              responsavelTecnico: t.responsavelTecnico || '',
              lancamentos: t.lancamentos || [],
              projectId: project.id,
            },
          });
        }
      }

      // Logs
      if (p.logs && Array.isArray(p.logs)) {
        await prisma.log.deleteMany({ where: { projectId: project.id } });
        for (const l of p.logs) {
          await prisma.log.create({
            data: {
              acao: l.acao || 'Log',
              data: l.data || new Date().toLocaleString('pt-BR'),
              justificativa: l.justificativa || '',
              user: l.user || 'Sistema',
              projectId: project.id,
            }
          });
        }
      }
    }

    // Relatórios
    console.log('📊 Migrando Relatórios...');
    for (const r of relatorios) {
      if (!r.id || !r.nome) continue;
      await prisma.report.upsert({
        where: { id: r.id },
        update: {
          nome: r.nome,
          dataGeracao: r.dataGeracao || new Date().toLocaleString('pt-BR'),
          geradoEm: r.geradoEm || new Date().toLocaleString('pt-BR'),
          autor: r.autor || 'Sistema',
          diretoria: r.diretoria || 'Geral',
          panorama: r.panorama || [],
          detalhes: r.detalhes || [],
        },
        create: {
          id: r.id,
          nome: r.nome,
          dataGeracao: r.dataGeracao || new Date().toLocaleString('pt-BR'),
          geradoEm: r.geradoEm || new Date().toLocaleString('pt-BR'),
          autor: r.autor || 'Sistema',
          diretoria: r.diretoria || 'Geral',
          panorama: r.panorama || [],
          detalhes: r.detalhes || [],
        },
      });
    }
  }

  // 4. Contatos de Terceiros
  const contactsPath = path.join(dataDir, 'contatos_terceiros.json');
  if (fs.existsSync(contactsPath)) {
    console.log('📞 Migrando Contatos Globais...');
    const contacts = JSON.parse(fs.readFileSync(contactsPath, 'utf-8'));
    for (const c of contacts) {
      if (!c.nome) continue;
      await prisma.thirdPartyContact.upsert({
        where: { id: c.id || c.nome },
        update: {
          nome: c.nome,
          email: c.email || '',
          telefone: c.telefone || '',
          tipo: c.tipo || '',
          empresa: c.empresa || '',
        },
        create: {
          id: c.id || c.nome,
          nome: c.nome,
          email: c.email || '',
          telefone: c.telefone || '',
          tipo: c.tipo || '',
          empresa: c.empresa || '',
        },
      });
    }
  }

  console.log('✅ Migração concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro na migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
