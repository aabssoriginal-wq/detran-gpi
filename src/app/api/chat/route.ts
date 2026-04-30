import { NextResponse } from 'next/server';
import { createProjeto, getProjetos } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "O corpo da requisição deve conter um array de 'messages'." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY não configurada no servidor." }, { status: 500 });
    }

    const projetosData = getProjetos();
    const projetosAtivos = projetosData.filter(p => !p.excluido);

    const portfolioInfo = JSON.stringify(projetosAtivos.map(p => ({
      nome: p.nome,
      status: p.status,
      responsavel: p.responsavel,
      progresso: p.progress
    })), null, 2);

    const systemPrompt = `Você é o Assistente IA do Sistema GPI (DETRAN-SP).
DADOS ATUAIS: ${portfolioInfo}
REGRA: Se o usuário pedir para criar projetos, retorne um JSON: [{"action": "create_project", "nome": "...", "responsavel": "..."}].
Caso contrário, responda em texto normal Markdown.`;

    const contents = [];
    let promptInjected = false;

    for (const msg of messages) {
      if (msg.role === 'assistant' && contents.length === 0) continue;
      
      let content = msg.content;
      if (!promptInjected && msg.role === 'user') {
        content = `${systemPrompt}\n\nPERGUNTA: ${content}`;
        promptInjected = true;
      }

      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: content }]
      });
    }

    const payload = {
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    };

    // Usando gemini-2.5-flash para máxima velocidade e compatibilidade
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || "Erro desconhecido";
      const isQuotaError = errorData.error?.code === 429 || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED');
      
      return NextResponse.json({ 
        error: isQuotaError 
          ? "Cota da API Gemini esgotada para hoje. A cota gratuita é renovada diariamente. Por favor, aguarde ou configure uma nova chave de API."
          : "Erro na API Gemini: " + errorMessage,
        details: errorMessage,
        isQuotaError
      }, { status: isQuotaError ? 429 : 500 });
    }

    const data = await response.json();
    const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao gerar resposta.";

    if (botResponse.includes('"action"') && botResponse.includes('"create_project"')) {
      try {
        const cleaned = botResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsedArray = JSON.parse(cleaned);
        
        if (Array.isArray(parsedArray)) {
          let sucesso: string[] = [];
          parsedArray.forEach(item => {
            if (item.action === "create_project") {
              createProjeto(item.nome, item.responsavel);
              sucesso.push(item.nome);
            }
          });
          return NextResponse.json({ reply: `Projetos criados: ${sucesso.join(", ")}` });
        }
      } catch (e) {}
    }

    return NextResponse.json({ reply: botResponse });

  } catch (error: any) {
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}
