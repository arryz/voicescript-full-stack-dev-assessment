interface Props {
  value: number;
}

function formatPay(value: number): string {
  if (value === 0) return '—';
  return `${value.toLocaleString()} IDR`;
}

export function PayDisplay({ value }: Props) {
  return <span className="text-sm text-gray-600">{formatPay(value)}</span>;
}
