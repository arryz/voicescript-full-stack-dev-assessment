import type { ReactNode } from 'react';
import { Label } from '../atoms/Label';

interface Props {
  label: string;
  children: ReactNode;
}

export function FormField({ label, children }: Props) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
