
const t1 = { dataInicio: "2026-05-01", dataFim: "2026-05-10", progress: 100 };
const t2 = { dataInicio: "2026-05-11", dataFim: "2026-05-11", progress: 0 };

function calculateProgress(tarefas) {
    let totalPonderado = 0;
    let totalDias = 0;
    
    tarefas.forEach(t => {
      const inicio = t.dataInicio ? new Date(t.dataInicio) : null;
      const fim = t.dataFim ? new Date(t.dataFim) : null;
      
      let dias = 1; 
      if (inicio && !isNaN(inicio.getTime()) && fim && !isNaN(fim.getTime())) {
        const diffTime = Math.abs(fim.getTime() - inicio.getTime());
        dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
      
      console.log(`Tarefa: ${t.progress}%, Dias: ${dias}`);
      totalPonderado += (t.progress || 0) * dias;
      totalDias += dias;
    });
    
    return totalDias > 0 ? Math.round(totalPonderado / totalDias) : 0;
}

console.log("Resultado:", calculateProgress([t1, t2]));
