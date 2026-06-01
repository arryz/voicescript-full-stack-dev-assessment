import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className = '' }: Props) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${className}`}>
      {children}
    </span>
  );
}
