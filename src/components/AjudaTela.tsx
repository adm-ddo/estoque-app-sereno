export default function AjudaTela({
  titulo = "Como funciona esta tela",
  children,
}: {
  titulo?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 open:pb-4">
      <summary className="cursor-pointer text-sm font-medium text-sky-800 flex items-center gap-2 select-none">
        <span className="text-base">💡</span>
        {titulo}
        <span className="ml-auto text-xs text-sky-500 group-open:hidden">
          ver mais
        </span>
      </summary>
      <div className="mt-2 text-sm text-sky-900 leading-relaxed flex flex-col gap-2">
        {children}
      </div>
    </details>
  );
}
