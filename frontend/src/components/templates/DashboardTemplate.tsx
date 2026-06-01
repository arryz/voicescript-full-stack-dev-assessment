import type { ReactNode } from 'react';

interface Props {
  header: ReactNode;
  form: ReactNode;
  error?: ReactNode;
  content: ReactNode;
  modal?: ReactNode;
}

export function DashboardTemplate({ header, form, error, content, modal }: Props) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {header}
        {form}
        {error}
        {content}
        {modal}
      </div>
    </div>
  );
}
