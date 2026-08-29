import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { formatMinutes } from '../lib/time';
import type { DayIndex, ScheduledStop } from '../domain/itinerary/types';
import { DAY_INDEXES } from '../domain/itinerary/types';
import { hasTrustedCoords } from '../domain/types';
import type { AppDispatch } from '../state/appReducer';

const DAY_COLORS: Record<DayIndex, string> = { 0: '#b5443c', 1: '#2e6f5e', 2: '#3c5a99' };
const ITALY_CENTER: L.LatLngTuple = [42.5, 12.5];
const ITALY_ZOOM = 6;
const STOP_ZOOM = 14;
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

interface MapStop {
  stop: ScheduledStop;
  day: DayIndex;
  order: number;
}

interface MapPanelProps {
  schedules: ScheduledStop[][];
  selectedStopId: string | null;
  dispatch: AppDispatch;
}

export function MapPanel({ schedules, selectedStopId, dispatch }: MapPanelProps) {
  const stops = useMemo(() => mappableStops(schedules), [schedules]);
  const empty = schedules.every((day) => day.length === 0);
  return (
    <div className="map-wrap">
      <MapContainer center={ITALY_CENTER} zoom={ITALY_ZOOM} className="map">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution={OSM_ATTRIBUTION}
        />
        {DAY_INDEXES.map((day) => (
          <DayRoute key={day} day={day} stops={stops} />
        ))}
        {stops.map((mapStop) => (
          <StopMarker key={mapStop.stop.place.id} mapStop={mapStop} dispatch={dispatch} />
        ))}
        <CameraSync stops={stops} selectedStopId={selectedStopId} />
      </MapContainer>
      {empty && <div className="map-hint">Add places to see them here</div>}
    </div>
  );
}

function mappableStops(schedules: ScheduledStop[][]): MapStop[] {
  return schedules.flatMap((dayStops, day) =>
    dayStops
      .map((stop, index) => ({ stop, day: day as DayIndex, order: index + 1 }))
      .filter(({ stop }) => hasTrustedCoords(stop.place))
  );
}

function toLatLng(stop: ScheduledStop): L.LatLngTuple {
  return [stop.place.coords.lat, stop.place.coords.lon];
}

function DayRoute({ day, stops }: { day: DayIndex; stops: MapStop[] }) {
  const positions = stops.filter((s) => s.day === day).map((s) => toLatLng(s.stop));
  if (positions.length < 2) return null;
  return (
    <Polyline
      positions={positions}
      pathOptions={{ color: DAY_COLORS[day], weight: 3, opacity: 0.55 }}
    />
  );
}

function StopMarker({ mapStop, dispatch }: { mapStop: MapStop; dispatch: AppDispatch }) {
  const { stop, day, order } = mapStop;
  const { place } = stop;
  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'map-marker-anchor',
        html: `<span class="map-marker" style="background:${DAY_COLORS[day]}">${order}</span>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      }),
    [day, order]
  );
  const select = () => {
    dispatch({ type: 'SELECT_STOP', placeId: place.id });
    document
      .getElementById(`stop-${place.id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  return (
    <Marker position={toLatLng(stop)} icon={icon} eventHandlers={{ click: select }}>
      <Popup>
        <strong>{place.name}</strong>
        <br />
        Day {day + 1} · {formatMinutes(stop.start)}–{formatMinutes(stop.end)}
        <br />
        {place.city}
      </Popup>
    </Marker>
  );
}

function CameraSync({
  stops,
  selectedStopId,
}: {
  stops: MapStop[];
  selectedStopId: string | null;
}) {
  const map = useMap();
  const idsKey = stops.map((s) => s.stop.place.id).join('|');
  const selected = stops.find((s) => s.stop.place.id === selectedStopId);
  const selectedLat = selected?.stop.place.coords.lat;
  const selectedLon = selected?.stop.place.coords.lon;
  const positionsRef = useRef<L.LatLngTuple[]>([]);
  positionsRef.current = stops.map((s) => toLatLng(s.stop));
  const hasSelectionRef = useRef(false);
  hasSelectionRef.current = selected !== undefined;

  useEffect(() => {
    if (selectedLat === undefined || selectedLon === undefined) return;
    map.flyTo([selectedLat, selectedLon], Math.max(map.getZoom(), STOP_ZOOM));
  }, [map, selectedLat, selectedLon]);

  useEffect(() => {
    if (hasSelectionRef.current) return;
    const positions = positionsRef.current;
    if (positions.length === 0) {
      map.setView(ITALY_CENTER, ITALY_ZOOM);
      return;
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
  }, [map, idsKey]);

  return null;
}
