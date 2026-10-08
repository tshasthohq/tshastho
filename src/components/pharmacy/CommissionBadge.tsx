'use client';

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export default function CommissionBadge({ status, size = 'md' }: Props) {
  const cls = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-700',
    FAILED: 'bg-red-100 text-red-800',
  };
  const color = map[status.toUpperCase()] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block rounded-full font-medium ${cls} ${color}`}>
      {status.toUpperCase()}
    </span>
  );
}
