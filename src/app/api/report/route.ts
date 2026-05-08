// v1.0.1 - Deploy Production
import { NextResponse } from "next/server";
import { getProjetos, saveRelatorio, getRelatorioById } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = process.env.GEMINI_API_KEY;
    const reportId = searchParams.get("id");

    const tipo = searchParams.get("tipo") || "completo";
    const inicioStr = searchParams.get("inicio");
    const fimStr = searchParams.get("fim");

    // SEGURANÇA: Obter dados da sessão do servidor quando disponível
    const session = await getServerSession(authOptions);
    const role = session?.user?.papel || searchParams.get("role");
    const userName = session?.user?.nome || searchParams.get("userName");
    const userDept = session?.user?.departamento || searchParams.get("dept");

    // Caso seja busca por ID (Histórico)
    if (reportId) {
      const salvo = getRelatorioById(reportId);
      if (salvo) return NextResponse.json(salvo);
      return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
    }
    
    if (role !== "admin_master" && role !== "admin_total") {
      return NextResponse.json({ error: "Acesso negado. Apenas Admin Master e Admin Total podem gerar relatórios." }, { status: 403 });
    }

    const todosProjetos = getProjetos();
    const favoritos = todosProjetos.filter(p => p.favoritos?.includes(userName || "") && !p.excluido);

    if (favoritos.length === 0) {
      return NextResponse.json({ error: "Nenhum projeto favoritado encontrado." }, { status: 404 });
    }

    // Helper para conversão de datas (DD/MM/YYYY para timestamp)
    const parseDataBR = (str: string) => {
      if (!str) return 0;
      const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (match) {
        return new Date(`${match[3]}-${match[2]}-${match[1]}T00:00:00`).getTime();
      }
      return 0;
    };
    
    let inicioTime = 0;
    let fimTime = Infinity;
    if (inicioStr && fimStr) {
      inicioTime = new Date(`${inicioStr}T00:00:00`).getTime();
      fimTime = new Date(`${fimStr}T23:59:59`).getTime();
    }

    // Cálculo da média de interações do departamento (apenas para relatório produtivo)
    let mediaDepartamento = 0;
    if (tipo === "produtivo") {
      const projetosDept = todosProjetos.filter(p => p.departamento === userDept && !p.excluido);
      let totalInteracoes = 0;
      projetosDept.forEach(p => {
        const logsCount = (p.logs || []).filter((l:any) => !inicioStr || (parseDataBR(l.data) >= inicioTime && parseDataBR(l.data) <= fimTime)).length;
        const lancCount = (p.tarefas || []).reduce((acc: number, t: any) => {
          return acc + (t.lancamentos || []).filter((l:any) => !inicioStr || (parseDataBR(l.data) >= inicioTime && parseDataBR(l.data) <= fimTime)).length;
        }, 0);
        totalInteracoes += (logsCount + lancCount);
      });
      mediaDepartamento = projetosDept.length > 0 ? (totalInteracoes / projetosDept.length) : 0;
    }

    // Preparar dados enriquecidos para a IA com filtros aplicados
    const dadosParaIA = favoritos.map(p => {
      // Filtrar logs
      const logsFiltrados = (p.logs || []).filter((l: any) => {
        if (!inicioStr) return true;
        const time = parseDataBR(l.data);
        return time >= inicioTime && time <= fimTime;
      });

      // Filtrar tarefas e lançamentos
      const tarefasMapeadas = (p.tarefas || []).map((t: any) => {
        const lancamentosFiltrados = (t.lancamentos || []).filter((l: any) => {
          if (!inicioStr) return true;
          const time = parseDataBR(l.data);
          return time >= inicioTime && time <= fimTime;
        });

        return {
          titulo: t.titulo,
          status: t.status,
          progresso: t.progress,
          inicio: t.dataInicio,
          fim: t.dataFim,
          notas: t.notas,
          impedimentoAtivo: t.impedimentoAtivo,
          motivoImpedimento: t.motivoImpedimento,
          numLancamentosNoPeriodo: lancamentosFiltrados.length,
          lancamentos: lancamentosFiltrados.map((l: any) => `[${l.data}] ${l.autor || 'Sistema'}: ${l.texto}`)
        };
      });

      return {
        nome: p.nome,
        escopo: p.escopo,
        status: p.status,
        progresso: p.progress,
        atraso: p.delta,
        departamento: p.departamento,
        responsavel: p.responsavel,
        baselineInicio: p.baselineData?.inicio,
        baselineFim: p.baselineData?.fim,
        contrato: p.contrato || "N/A", // caso exista futuramente
        recursos: p.recursos || "N/A", // caso exista futuramente
        fornecedor: p.fornecedor || "N/A",
        totalLogsNoPeriodo: logsFiltrados.length,
        logs: logsFiltrados.slice(-50).map((l: any) => `[${l.data}] ${l.user || 'Sistema'}: ${l.acao}`), // limite alto para contexto da IA
        tarefas: tarefasMapeadas
      };
    });

    let instrucoesTipo = "";
    if (tipo === "completo") {
      instrucoesTipo = `
      FOCO DO RELATÓRIO: EXECUTIVO COMPLETO.
      Seja formal, analítico e profundo.
      Analise o escopo, contrato (se houver), atrasos, justificativas e notas das tarefas.
      Traga recomendações de mitigação de riscos estruturados.
      Mantenha total impessoalidade.`;
    } else if (tipo === "resumido") {
      instrucoesTipo = `
      FOCO DO RELATÓRIO: EXECUTIVO RESUMIDO.
      Seja extremamente direto, curto e objetivo.
      Use bullet points.
      Foque na saúde atual, percentual de progresso e viabilidade de conclusão no prazo.
      Mantenha total impessoalidade.`;
    } else if (tipo === "produtivo") {
      instrucoesTipo = `
      FOCO DO RELATÓRIO: PRODUTIVO E ENGAJAMENTO.
      MUITO IMPORTANTE: ABANDONE A IMPESSOALIDADE! Este relatório avalia a equipe.
      Analise a interatividade dos usuários com base nos 'logs' e 'lancamentos' do período.
      Cite nomes de usuários que registraram atualizações relevantes (ex: "O usuário X realizou várias atualizações...").
      Compare explicitamente o total de interações (logs + lançamentos) destes projetos favoritados com a 'MÉDIA DO DEPARTAMENTO' (que foi de ${mediaDepartamento.toFixed(1)} interações por projeto neste período).
      Julgue de forma engajadora se a equipe deste projeto está ativa ou se o projeto está sem interações (sem logs recentes).`;
    }

    const periodoTexto = inicioStr ? `PERÍODO DE ANÁLISE DOS LOGS: ${inicioStr} até ${fimStr}` : "PERÍODO DE ANÁLISE DOS LOGS: Todo o histórico.";

    const prompt = `Gere um JSON para um Relatório do DETRAN-SP.
    ${periodoTexto}
    
    ${instrucoesTipo}

    PROJETOS FAVORITADOS: ${JSON.stringify(dadosParaIA)}
    
    INSTRUÇÕES OBRIGATÓRIAS:
    1. Analise as datas de 'baselineInicio' e 'baselineFim' do projeto.
    2. No campo 'eventosCriticos', destaque eventos relevantes baseados no foco escolhido.
    3. No campo 'panorama', crie 3 itens criativos destacando aspectos centrais do foco do relatório.
    4. COPIE obrigatoria e exatamente as datas de 'baselineInicio' e 'baselineFim' para os respectivos campos no JSON de saída.
    
    ESTRUTURA DO JSON ESPERADA:
    {
      "geradoEm": "${new Date().toLocaleString('pt-BR')}",
      "panorama": [
        {"titulo": "string", "descricao": "string", "nivel": "alto|medio|baixo"}
      ],
      "detalhes": [
        {
          "id": number,
          "nome": "string",
          "progress": number,
          "departamento": "string",
          "analiseIA": "string (texto detalhado e rico seguindo as instruções de foco)",
          "conclusao": "string (recomendação ou constatação final)",
          "eventosCriticos": ["string"],
          "baselineInicio": "string (YYYY-MM-DD)",
          "baselineFim": "string (YYYY-MM-DD)"
        }
      ]
    }`;

    const model = "gemini-2.5-flash"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const result = await response.json();
    
    // Validação ultra-robusta da resposta do Gemini
    let rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      console.error("Gemini API - Resposta Sem Conteúdo:", JSON.stringify(result, null, 2));
      const errorMsg = result?.error?.message || "A IA não retornou um conteúdo válido.";
      throw new Error(errorMsg);
    }

    // Limpeza de Markdown (caso a IA envie ```json ... ```)
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    let reportData;
    try {
      reportData = JSON.parse(rawText);
    } catch (e) {
      console.error("Erro ao parsear JSON da IA. Texto bruto:", rawText);
      throw new Error("O formato do relatório gerado pela IA é inválido.");
    }

    // SALVAR NO HISTÓRICO
    const agora = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    let prefixoSigla = "Relatório";
    if (tipo === "completo") prefixoSigla = "REC";
    else if (tipo === "resumido") prefixoSigla = "RER";
    else if (tipo === "produtivo") prefixoSigla = "RP";

    const nomeFormatado = `${prefixoSigla}_${agora.getFullYear()}_${pad(agora.getMonth() + 1)}_${pad(agora.getDate())}_${pad(agora.getHours())}_${pad(agora.getMinutes())}_${pad(agora.getSeconds())}_${userName?.toUpperCase().replace(/\s+/g, '_')}`;

    const novoRelatorio = {
      id: `REL-${Date.now()}`,
      nome: nomeFormatado,
      tipo: tipo,
      periodo: inicioStr ? `${inicioStr} a ${fimStr}` : "Todo o Período",
      geradoEm: agora.toLocaleString('pt-BR'),
      dataGeracao: agora.toLocaleString('pt-BR'),
      autor: userName || "Sistema",
      diretoria: userDept || "Geral",
      panorama: reportData.panorama || [],
      detalhes: reportData.detalhes.map((d: any) => ({
        ...d,
        baselineData: {
          inicio: d.baselineInicio || "N/D",
          fim: d.baselineFim || "N/D"
        }
      }))
    };
    saveRelatorio(novoRelatorio);

    return NextResponse.json(novoRelatorio);
  } catch (error: any) {
    console.error("Erro na API de Relatório:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
