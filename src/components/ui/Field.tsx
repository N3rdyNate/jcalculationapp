import { useId, cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react';

export function Field({
  label,
  error,
  hint,
  children,
  className = '',
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  // Wire the label to the child input/select by injecting an `id` prop
  // when the child doesn't already supply one. This keeps click-on-
  // label focus working and makes screen readers announce the label.
  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string }>, {
        id: (children as ReactElement<{ id?: string }>).props.id ?? id,
      })
    : children;
  const childId =
    isValidElement(children) &&
    (children as ReactElement<{ id?: string }>).props.id
      ? (children as ReactElement<{ id?: string }>).props.id
      : id;

  return (
    <div className={`block ${className}`}>
      <label
        htmlFor={childId}
        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
      >
        {label}
      </label>
      {child}
      {hint && !error && (
        <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
          {hint}
        </span>
      )}
      {error && (
        <span className="block text-xs text-red-600 dark:text-red-400 mt-1">
          {error}
        </span>
      )}
    </div>
  );
}
