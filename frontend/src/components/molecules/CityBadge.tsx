import { Badge } from '../atoms/Badge';

interface Props {
  city: string;
  isMatch?: boolean;
}

export function CityBadge({ city, isMatch = false }: Props) {
  return (
    <Badge className={isMatch ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
      {city}
    </Badge>
  );
}
