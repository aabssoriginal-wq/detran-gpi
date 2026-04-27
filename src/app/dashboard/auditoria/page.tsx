"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, Search, Filter, ShieldCheck, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AuditoriaTotalPage() {
  const { usuario } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const isAdmin = usuario?.papel === "admin_total" || usuario?.papel === "admin_master";

  useEffect(() => {
    if (!usuario) return;
    setLoading(true);
    fetch(`/api/projects/auditoria?dept=${encodeURIComponent(usuario.departamento)}&role=${usuario.papel}`)
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [usuario]);

  const filteredLogs = logs.filter(l => 
    l.acao.toLowerCase().includes(search.toLowerCase()) ||
    l.projetoNome.toLowerCase().includes(search.toLowerCase()) ||
    l.user.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldCheck className="h-12 w-12 text-slate-200 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Acesso Restrito</h2>
        <p className="text-slate-500 max-w-xs mx-auto">Esta ferramenta é exclusiva para perfis Administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-indigo-600" /> Auditoria Total
          </h1>
          <p className="text-sm text-slate-500">
            {usuario?.papel === 'admin_total' 
              ? 'Histórico global de todas as alterações em todas as Diretorias.' 
              : `Histórico de alterações da ${usuario?.departamento}.`}
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <Card className="border-indigo-100 shadow-sm">
        <CardHeader className="pb-3 border-b border-indigo-50/50">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Filtrar por projeto, ação ou usuário..." 
                className="pl-9 bg-slate-50 border-slate-200" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
               <Badge variant="outline" className="bg-white border-indigo-200 text-indigo-700">
                 {filteredLogs.length} Registros Encontrados
               </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-800/50 border-b">
                  <tr>
                    <th className="px-6 py-3">Data/Hora</th>
                    <th className="px-6 py-3">Diretoria</th>
                    <th className="px-6 py-3">Iniciativa</th>
                    <th className="px-6 py-3">Ação</th>
                    <th className="px-6 py-3">Usuário</th>
                    <th className="px-6 py-3">Justificativa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">{log.data}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                          {log.departamento?.replace('Diretoria de ', '')}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{log.projetoNome}</td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{log.acao}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                            {log.user.charAt(0)}
                          </div>
                          <span className="text-slate-600">{log.user}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.justificativa && log.justificativa !== "Nenhuma" ? (
                          <div className="max-w-xs truncate text-[11px] text-slate-400 italic" title={log.justificativa}>
                            "{log.justificativa}"
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLogs.length === 0 && (
                <div className="py-20 text-center text-slate-400">
                  Nenhum registro encontrado para esta busca.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
