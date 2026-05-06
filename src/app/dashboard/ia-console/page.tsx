"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BotMessageSquare, Send, Paperclip, Sparkles, ShieldAlert, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function IAConsolePage() {
  const { usuario } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Olá, sou o assistente IA do GPI (Gemini). Como posso ajudar com a gestão de projetos hoje?" }
  ]);

  // Bloqueio por papel
  if (usuario && usuario.papel === 'usuario') {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <ShieldAlert className="h-12 w-12 text-amber-500" />
        <h2 className="text-xl font-bold">Acesso Restrito</h2>
        <p className="text-slate-500 text-sm text-center max-w-sm">
          O Console de Inteligência Artificial está disponível apenas para usuários com perfil <strong>Master</strong> ou <strong>Super Admin</strong>.
        </p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!prompt.trim()) return;
    
    const newMsg = { role: "user", content: prompt };
    const newMessages = [...messages, newMsg];
    
    setMessages(newMessages);
    setPrompt("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: newMessages })
      });

      const data = await response.json();
      
      if (!response.ok) {
        const isQuota = data.isQuotaError || response.status === 429;
        const msg = data.error || "Falha na comunicação.";
        if (isQuota) {
          toast.error("Cota da API Gemini esgotada.", { duration: 8000 });
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: "⚠️ **Cota da API Gemini esgotada**\n\nO limite diário gratuito da chave de API foi atingido. Isso acontece quando muitas requisições são feitas em um curto período.\n\n**Solução:**\n1. Aguarde a renovação automática (ocorre diariamente à meia-noite)\n2. Ou gere uma nova chave em: https://aistudio.google.com/apikey e atualize o arquivo `.env.local`" 
          }]);
        } else {
          throw new Error(msg);
        }
        return;
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro: ${error.message}`);
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <BotMessageSquare className="h-8 w-8 text-blue-500" />
          Console de Inteligência Artificial
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Crie projetos via linguagem natural, importe planilhas para mapeamento automático ou gere apresentações corporativas.
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden shadow-md border-blue-100 dark:border-blue-900/50">
        <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30">
          <CardTitle className="flex items-center justify-between text-blue-900 dark:text-blue-300">
            <span className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Assistente GPI (Powered by Gemini)</span>
          </CardTitle>
          <CardDescription>
            Funcionalidades exclusivas habilitadas conforme o seu perfil (Master / Responsável).
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 max-w-[80%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
              <Avatar className="h-8 w-8 shrink-0">
                {msg.role === "assistant" ? (
                  <>
                    <AvatarFallback className="bg-blue-100 text-blue-600"><BotMessageSquare className="h-4 w-4" /></AvatarFallback>
                  </>
                ) : (
                  <>
                    <AvatarImage src={usuario?.avatar || ""} />
                    <AvatarFallback>{usuario?.nome?.substring(0, 2).toUpperCase() || "US"}</AvatarFallback>
                  </>
                )}
              </Avatar>
              <div className={`p-4 rounded-lg text-sm shadow-sm whitespace-pre-wrap ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white" 
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 max-w-[80%]">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-600"><BotMessageSquare className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce"></span>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="w-full flex items-end gap-2">
            <Button variant="outline" size="icon" className="shrink-0" onClick={() => toast.info("Simulando upload de arquivo (Ata/Excel)")}>
              <Paperclip className="h-4 w-4 text-slate-500" />
            </Button>
            <div className="relative flex-1">
              <Textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Ex: "Criar a iniciativa de Identidade Digital para iniciar amanhã e atribuir a Luiz Wanderley"'
                className="min-h-[60px] max-h-[120px] resize-none pr-12 focus-visible:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button 
                size="icon" 
                className="absolute right-2 bottom-2 h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                onClick={handleSend}
                disabled={!prompt.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
