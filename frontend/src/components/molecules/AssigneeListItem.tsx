import { Button } from '../atoms/Button';
import { CityBadge } from './CityBadge';

interface Props {
  name: string;
  city?: string;
  isMatch?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export function AssigneeListItem({ name, city, isMatch = false, disabled, onSelect }: Props) {
  return (
    <li className="py-2 flex justify-between items-center">
      <span>
        <span className="font-medium text-gray-800">{name}</span>{' '}
        {city && <CityBadge city={city} isMatch={isMatch} />}
      </span>
      <Button size="sm" disabled={disabled} onClick={onSelect}>
        Select
      </Button>
    </li>
  );
}
