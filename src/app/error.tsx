"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
      <h2 className="text-xl font-bold text-red-600 mb-4">Algo deu errado!</h2>
      <pre className="p-4 bg-white border rounded text-xs overflow-auto max-w-full mb-4">
        {error.message}
      </pre>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Tentar Novamente
      </button>
    </div>
  );
}
