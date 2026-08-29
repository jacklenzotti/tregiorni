import type { Place } from '../domain/types';
import { priceLabel } from '../lib/placeLabels';

type PriceLevel = Place['priceLevel'];

const LEVELS: PriceLevel[] = [1, 2, 3, 4];

export function PriceSelect({
  value,
  onChange,
}: {
  value: PriceLevel;
  onChange: (level: PriceLevel) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value) as PriceLevel)}>
      {LEVELS.map((level) => (
        <option key={level} value={level}>
          ≤ {priceLabel(level)}
        </option>
      ))}
    </select>
  );
}
