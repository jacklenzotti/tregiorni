export interface RawPlace {
  id: string;
  name: string;
  type: string;
  city: string;
  region: string;
  neighborhood: string | null;
  description: string;
  latitude: number;
  longitude: number;
  hours: string | null;
  duration_minutes: number | null;
  price_range: string;
  rating: number;
  tags: string[];
  seasonal_notes: string | null;
  booking_required: boolean | null;
}
