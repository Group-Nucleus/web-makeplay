export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="mb-2 block text-xs font-bold tracking-wider text-muted">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export const inputClass =
  'w-full rounded-xl border border-line bg-card px-4 py-3 text-white outline-none focus:border-lime';
