import type { ButtonHTMLAttributes } from 'react';

type Color = 'blue' | 'yellow' | 'purple' | 'green';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'text';
  size?: 'sm' | 'md';
  color?: Color;
}

const TEXT_COLORS: Record<Color, string> = {
  blue: 'text-blue-600 hover:text-blue-800',
  yellow: 'text-yellow-600 hover:text-yellow-800',
  purple: 'text-purple-600 hover:text-purple-800',
  green: 'text-green-600 hover:text-green-800',
};

export function Button({
  variant = 'primary',
  size = 'md',
  color = 'blue',
  className = '',
  children,
  ...props
}: Props) {
  const base = 'font-medium transition-colors disabled:opacity-50';

  if (variant === 'text') {
    return (
      <button className={`${base} text-xs ${TEXT_COLORS[color]} ${className}`} {...props}>
        {children}
      </button>
    );
  }

  const sizes = { sm: 'text-sm px-3 py-1', md: 'text-sm px-5 py-2' };

  return (
    <button
      className={`${base} bg-blue-600 hover:bg-blue-700 text-white rounded ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
