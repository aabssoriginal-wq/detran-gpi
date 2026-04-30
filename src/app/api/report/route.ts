// v1.0.1 - Deploy Production
import { NextResponse } from "next/server";
import { getProjetos, saveRelatorio, getRelatorioById } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const userName = searchParams.get("userName");
    const userDept = searchParams.get("dept");
    const reportId = searchParams.get("id");

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

    // Preparar dados simplificados para a IA
    const dadosParaIA = favoritos.map(p => ({
      nome: p.nome,
      escopo: p.escopo,
      status: p.status,
      progresso: p.progress,
      atraso: p.delta,
      logs: (p.logs || []).slice(0, 5).map(l => `${l.data}: ${l.acao}`),
      tarefasAtrasadas: (p.tarefas || []).filter(t => t.status !== 'concluído' && t.dataFim && new Date(t.dataFim) < new Date()).map(t => t.titulo)
    }));

    const prompt = `Gere um JSON para um Relatório Executivo do DETRAN-SP.
    PROJETOS FAVORITADOS: ${JSON.stringify(dadosParaIA)}
    
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
          "analiseIA": "string (resumo executivo do status)",
          "conclusao": "string (recomendação)",
          "eventosCriticos": ["string"]
        }
      ]
    }`;

    const apiKey = process.env.GEMINI_API_KEY;
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
    const nomeFormatado = `Relatório_${agora.getFullYear()}_${pad(agora.getMonth() + 1)}_${pad(agora.getDate())}_${pad(agora.getHours())}_${pad(agora.getMinutes())}_${pad(agora.getSeconds())}_${userName?.toUpperCase().replace(/\s+/g, '_')}`;

    const novoRelatorio = {
      id: `REL-${Date.now()}`,
      nome: nomeFormatado,
      geradoEm: agora.toLocaleString('pt-BR'),
      dataGeracao: agora.toLocaleString('pt-BR'),
      autor: userName || "Sistema",
      diretoria: userDept || "Geral",
      panorama: reportData.panorama,
      detalhes: reportData.detalhes
    };
    saveRelatorio(novoRelatorio);

    return NextResponse.json(novoRelatorio);
  } catch (error: any) {
    console.error("Erro na API de Relatório:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
