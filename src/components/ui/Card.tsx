import type { ReactNode } from 'react';

export function Card({
  title,
  description,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}
    >
      {(title || description) && (
        <header className="px-5 py-3 border-b border-slate-200">
          {title && (
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          )}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
