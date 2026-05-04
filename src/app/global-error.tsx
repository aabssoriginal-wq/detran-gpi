"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <h2 className="text-xl font-bold text-red-600">Erro Crítico de Sistema</h2>
          <pre>{error.message}</pre>
          <button onClick={() => reset()}>Reiniciar</button>
        </div>
      </body>
    </html>
  );
}
