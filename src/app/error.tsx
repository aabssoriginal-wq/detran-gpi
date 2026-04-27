"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Aqui poderíamos enviar o erro para um serviço como Sentry ou Application Insights
    console.error("Aplicação detectou um erro:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Ops! Algo deu errado.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Encontramos um erro inesperado ao tentar carregar esta interface.
          </p>
          
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-md text-left font-mono overflow-auto max-h-32 border border-red-100 dark:border-red-900/50">
            <span className="font-semibold block mb-1">Motivo do Erro:</span>
            {error.message || "Erro interno não especificado."}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <Button 
            onClick={() => reset()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <RefreshCcw className="w-4 h-4" /> Tentar Novamente
          </Button>
        </div>
      </div>
    </div>
  );
}
