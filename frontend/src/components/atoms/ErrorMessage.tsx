interface Props {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className = '' }: Props) {
  return <p className={`text-red-600 text-sm ${className}`}>{message}</p>;
}
