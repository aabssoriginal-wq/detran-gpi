const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'data.json');
const usersPath = path.join(process.cwd(), 'users.json');

let projetos = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
let usuarios = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));

console.log("Iniciando adequação de 100% da massa de dados...");

// 1. Sincronizar Projetos com Usuários
projetos.forEach(p => {
  if (p.responsavel && p.responsavel !== "Não Definido") {
    const user = usuarios.find(u => u.nome.trim().toLowerCase() === p.responsavel.trim().toLowerCase());
    if (user) {
      if (!user.projetosAtribuidos) user.projetosAtribuidos = [];
      if (!user.projetosAtribuidos.includes(p.id)) {
        user.projetosAtribuidos.push(p.id);
        console.log(`Projeto ${p.id} vinculado ao usuário ${user.nome}`);
      }
    }
  }

  // 2. Recalcular Progresso do Projeto baseado nas Tarefas
  if (p.tarefas && p.tarefas.length > 0) {
    let totalPond = 0;
    let totalDias = 0;

    p.tarefas.forEach(t => {
      const inicio = t.dataInicio ? new Date(t.dataInicio) : new Date();
      const fim = t.dataFim ? new Date(t.dataFim) : inicio;
      // Cálculo de dias (mínimo 1 dia para evitar divisão por zero)
      const dias = Math.max(1, Math.ceil(Math.abs(fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      
      totalPond += (t.progress || 0) * dias;
      totalDias += dias;
    });

    const novoProgresso = totalDias > 0 ? Math.round(totalPond / totalDias) : 0;
    
    if (p.progress !== novoProgresso) {
      console.log(`Projeto ${p.id}: Progresso ajustado de ${p.progress}% para ${novoProgresso}%`);
      p.progress = novoProgresso;
    }

    // Atualizar Status Visual conforme progresso
    if (p.progress === 100) {
      p.status = "concluido";
      p.text = "Concluído";
      p.indicator = "bg-emerald-600";
    } else if (p.progress > 0) {
      p.status = "desenvolvimento";
      p.text = "Desenvolvimento";
      p.indicator = "bg-amber-500";
    }
  }
});

fs.writeFileSync(dataPath, JSON.stringify(projetos, null, 2));
fs.writeFileSync(usersPath, JSON.stringify(usuarios, null, 2));

console.log("Adequação finalizada com sucesso!");
