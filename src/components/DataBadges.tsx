import type { DataFlag, Place } from '../domain/types';

// Exhaustive on purpose: a new data flag must decide here whether it is shown.
// null = deliberately silent (aliases never reach the UI at all).
const FLAG_LABELS: Record<DataFlag, { label: string; title: string } | null> = {
  'hours-unverified': {
    label: 'Hours unverified',
    title: 'No opening hours in the source. Scheduled only between 10:00 and 18:00.',
  },
  'hours-approximated': {
    label: 'Hours approximate',
    title: 'Source gave vague text such as "Evenings". Times inferred, not published.',
  },
  'hours-unparsed': {
    label: 'Hours unreadable',
    title: 'Source hours could not be parsed. Treated as unknown.',
  },
  'duration-estimated': {
    label: 'Duration estimated',
    title: 'No visit length in the source. Estimated from the median for this type.',
  },
  'booking-unknown': {
    label: 'Booking — check ahead',
    title: 'Source does not say whether booking is required.',
  },
  'coords-suspect': {
    label: 'Location approximate',
    title: 'Coordinates are far from the city centre. Excluded from the map and travel times.',
  },
  alias: null,
};

interface Badge {
  key: string;
  label: string;
  title: string;
}

export function DataBadges({ place }: { place: Place }) {
  const badges: Badge[] = place.flags.flatMap((flag) => {
    const entry = FLAG_LABELS[flag];
    return entry === null ? [] : [{ key: flag, ...entry }];
  });
  if (place.bookingRequired === true) {
    badges.push({
      key: 'booking-required',
      label: 'Booking required',
      title: 'Book this one ahead of time.',
    });
  }
  if (badges.length === 0) return null;
  return (
    <span className="badges">
      {badges.map(({ key, label, title }) => (
        <span key={key} className="badge" title={title}>
          {label}
        </span>
      ))}
    </span>
  );
}

export function SeasonalNote({ place }: { place: Place }) {
  if (place.seasonalNote === null) return null;
  return <span className="seasonal-note">{place.seasonalNote}</span>;
}
