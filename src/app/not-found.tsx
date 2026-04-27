import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
          <FileQuestion className="w-8 h-8 text-amber-600 dark:text-amber-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Página não encontrada
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            O recurso ou link que você tentou acessar não existe, foi movido ou você não tem permissão para acessá-lo.
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white w-full">
              <Home className="w-4 h-4" /> Retornar ao Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
