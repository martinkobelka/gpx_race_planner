import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import type { GpxPoint, Segment } from '../types';
import { useHoveredSegment } from '../hooks/useHoveredSegment';
import { TILE_LAYERS, DEFAULT_TILE_LAYER_ID } from '../data/tileLayers';
import { useT } from '../i18n/useT';

interface Props {
  points: GpxPoint[];
  segments: Segment[];
  kmMarkersEnabled?: boolean;
  scaleEnabled?: boolean;
  tileLayerId?: string;
}

const SEGMENT_COLORS: Record<string, string> = {
  uphill:   '#ef4444',
  downhill: '#22c55e',
  flat:     '#64748b',
};

// Calls invalidateSize whenever the map container is resized
const MapResizer: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
};

// Fits map to the route bounds whenever points change
const BoundsFitter: React.FC<{ bounds: LatLngBoundsExpression }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [16, 16] });
  }, [map, bounds]);
  return null;
};

// Button placed below +/- that fits the view to the full route
const FitControl: React.FC<{ bounds: LatLngBoundsExpression }> = ({ bounds }) => {
  const map = useMap();
  const t = useT();
  useEffect(() => {
    const ctrl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const a = L.DomUtil.create('a', '', container);
        a.title = t.mapFitRoute;
        a.href = '#';
        a.style.cssText = 'font-size:16px;display:flex;align-items:center;justify-content:center;';
        a.innerHTML = '⊙';
        L.DomEvent.on(a, 'click', (e) => {
          L.DomEvent.stopPropagation(e);
          L.DomEvent.preventDefault(e);
          map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [16, 16] });
        });
        return container;
      },
    });
    const instance = new ctrl();
    instance.addTo(map);
    return () => { instance.remove(); };
  }, [map, bounds]);
  return null;
};

const RouteMap: React.FC<Props> = ({ points, segments, kmMarkersEnabled = false, scaleEnabled = true, tileLayerId = DEFAULT_TILE_LAYER_ID }) => {
  const { hoveredId, setHoveredId, setHoveredKmDist } = useHoveredSegment();
  const tileLayer = TILE_LAYERS.find((l) => l.id === tileLayerId) ?? TILE_LAYERS[0];

  // Map each segment to its subset of lat/lon points
  const segmentLines = useMemo(() => {
    return segments.map((seg) => {
      const pts = points.filter(
        (p) => p.distance >= seg.startDistance - 1 && p.distance <= seg.endDistance + 1
      );
      return {
        id: seg.id,
        type: seg.type,
        positions: pts.map((p): LatLngTuple => [p.lat, p.lon]),
      };
    });
  }, [points, segments]);

  const bounds: LatLngBoundsExpression = useMemo(() => {
    const lats = points.map((p) => p.lat);
    const lons = points.map((p) => p.lon);
    return [
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)],
    ];
  }, [points]);

  const center: LatLngTuple = useMemo(
    () => [points[0]?.lat ?? 50, points[0]?.lon ?? 14],
    [points]
  );

  const kmMarkers = useMemo(() => {
    if (!kmMarkersEnabled || points.length < 2) return [];
    const totalDist = points[points.length - 1].distance;
    const markers: { km: number; dist: number; pos: LatLngTuple }[] = [];
    for (let km = 1; km * 1000 <= totalDist; km++) {
      const dist = km * 1000;
      let lo = 0, hi = points.length - 2;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (points[mid + 1].distance < dist) lo = mid + 1;
        else hi = mid;
      }
      const p1 = points[lo], p2 = points[lo + 1];
      const span = p2.distance - p1.distance;
      const frac = span > 0 ? (dist - p1.distance) / span : 0;
      markers.push({
        km,
        dist,
        pos: [p1.lat + (p2.lat - p1.lat) * frac, p1.lon + (p2.lon - p1.lon) * frac],
      });
    }
    return markers;
  }, [points, kmMarkersEnabled]);

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="route-map"
      zoomControl={true}
    >
      <MapResizer />
      <BoundsFitter bounds={bounds} />
      {points.length > 0 && <FitControl bounds={bounds} />}
      {scaleEnabled && <ScaleControl position="bottomleft" imperial={false} />}
      <TileLayer
        key={tileLayer.id}
        url={tileLayer.url}
        attribution={tileLayer.attribution}
        maxZoom={tileLayer.maxZoom}
      />
      {segmentLines.map((seg) => {
        const isHovered = hoveredId === seg.id;
        return (
          <Polyline
            key={seg.id}
            positions={seg.positions}
            pathOptions={{
              color: SEGMENT_COLORS[seg.type],
              weight: isHovered ? 6 : 4,
              opacity: isHovered ? 1 : 0.7,
            }}
            eventHandlers={{
              mouseover: () => setHoveredId(seg.id),
              mouseout: () => setHoveredId(null),
            }}
          />
        );
      })}
      {kmMarkers.map(({ km, dist, pos }) => {
        const seg = segments.find((s) => dist >= s.startDistance && dist <= s.endDistance);
        return (
          <CircleMarker
            key={km}
            center={pos}
            radius={5}
            pathOptions={{ color: '#1e293b', fillColor: '#ffffff', fillOpacity: 1, weight: 2 }}
            eventHandlers={{
              mouseover: () => { if (seg) setHoveredId(seg.id); setHoveredKmDist(dist); },
              mouseout:  () => { setHoveredId(null); setHoveredKmDist(null); },
            }}
          >
            <Tooltip>{km} km</Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
};

export default RouteMap;
