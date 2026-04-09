import { forwardRef, type SelectHTMLAttributes } from 'react';

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className = '', children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});
