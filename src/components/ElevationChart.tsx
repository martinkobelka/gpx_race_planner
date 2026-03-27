import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import type { GpxPoint, Segment } from '../types';
import { useT } from '../i18n/useT';
import { useElevationGeometry } from '../hooks/useElevationGeometry';
import { useElevationCursor } from '../hooks/useElevationCursor';
import { useHoveredSegment } from '../hooks/useHoveredSegment';
import ElevationInfoBar from './ElevationInfoBar';

interface Props {
  points: GpxPoint[];
  segments: Segment[];
}

const SEGMENT_COLORS: Record<string, string> = {
  uphill:   '#ef4444',
  downhill: '#22c55e',
  flat:     '#64748b',
};

const ElevationChart: React.FC<Props> = ({ points, segments }) => {
  const t = useT();
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);

  const geo    = useElevationGeometry(points, zoom, containerWidth);
  const cursor = useElevationCursor(points, segments, geo.toY, geo.chartW, geo.totalDist);
  const { hoveredKmDist } = useHoveredSegment();

  const { height, paddingLeft, paddingRight, paddingTop, chartW, chartH, minZoom, totalDist, toX, toY, decimatedPoints, pathData, xTicks, yTicks } = geo;
  const { hoveredId, setHoveredId, cursorX, setCursorX, cursorDist, cursorElev, cursorMarkerY, cursorGrade, segment, handleMouseMove } = cursor;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', handler, { passive: false });

    const obs = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    obs.observe(el);

    return () => {
      el.removeEventListener('wheel', handler);
      obs.disconnect();
    };
  }, []);

  useEffect(() => {
    if (hoveredId === null || !containerRef.current) return;

    const el = containerRef.current;
    if (el.matches(':hover')) return;

    const seg = segments.find((s) => s.id === hoveredId);
    if (!seg) return;

    const segCenterX = ((seg.startDistance + seg.endDistance) / 2 / totalDist) * chartW;
    const targetScrollLeft = Math.max(0, segCenterX - el.clientWidth / 2);
    el.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
  }, [hoveredId, segments, points, zoom, totalDist, chartW]);

  const legend = [
    { type: 'uphill',   label: t.chartUphill },
    { type: 'downhill', label: t.chartDownhill },
    { type: 'flat',     label: t.chartFlat },
  ];

  if (points.length === 0) {
    return <div className="chart-empty-text">{t.chartEmpty}</div>;
  }

  return (
    <div className="elevation-chart-wrapper">

      {/* Header: legenda + zoom tlačítka */}
      <div className="elevation-chart-header">
        <div className="elevation-legend">
          {legend.map(({ type, label }) => (
            <span key={type} className="elevation-legend-item">
              <span className="elevation-legend-swatch" style={{ background: SEGMENT_COLORS[type] }} />
              {label}
            </span>
          ))}
        </div>
        <div className="elevation-zoom-controls">
          <Button icon="pi pi-minus" size="small" text disabled={zoom <= minZoom * 1.01} onClick={() => setZoom(z => Math.max(minZoom, z / 1.5))} />
          <Button icon="pi pi-plus"  size="small" text disabled={zoom >= 8} onClick={() => setZoom(z => Math.min(8, z * 1.5))} />
        </div>
      </div>

      {/* Tělo grafu: pevná Y-osa vlevo + scrollovatelný obsah */}
      <div className="elevation-chart-body">

        {/* Pevná Y-osa */}
        <svg className="elevation-y-axis-svg" width={paddingLeft} height={height}>
          <line x1={paddingLeft - 1} y1={paddingTop} x2={paddingLeft - 1} y2={paddingTop + chartH} stroke="#475569" strokeWidth={1.5} />
          {yTicks.map(({ y, v }) => (
            <g key={v}>
              <line x1={paddingLeft - 5} y1={y} x2={paddingLeft - 1} y2={y} stroke="#475569" strokeWidth={1} />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#64748b">{v}</text>
            </g>
          ))}
          <text x={10} y={paddingTop + chartH / 2} textAnchor="middle" fontSize={10} fill="#64748b"
            transform={`rotate(-90, 10, ${paddingTop + chartH / 2})`}>{t.chartYLabel}</text>
        </svg>

        {/* Scrollovatelný obsah */}
        <div ref={containerRef} className="elevation-scroll-container">
          <svg
            width={chartW + paddingRight}
            height={height}
            className="elevation-svg"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { setHoveredId(null); setCursorX(null); }}
          >
            {/* Grid */}
            {yTicks.map(({ y, v }) => (
              <line key={v} x1={0} y1={y} x2={chartW} y2={y} stroke="#e2e8f0" strokeWidth={1} />
            ))}

            {/* Segment color bands */}
            {segments.map((seg) => {
              const x1 = toX(seg.startDistance);
              const x2 = toX(seg.endDistance);
              const isHovered = hoveredId === seg.id;
              return (
                <rect
                  key={seg.id}
                  x={x1} y={paddingTop}
                  width={x2 - x1} height={chartH}
                  fill={SEGMENT_COLORS[seg.type]}
                  opacity={isHovered ? 0.35 : 0.12}
                  className="seg-band"
                />
              );
            })}

            {/* Hovered segment highlight border */}
            {hoveredId !== null && (() => {
              const seg = segments.find((s) => s.id === hoveredId);
              if (!seg) return null;
              const x1 = toX(seg.startDistance);
              const x2 = toX(seg.endDistance);
              return (
                <rect
                  x={x1} y={paddingTop}
                  width={x2 - x1} height={chartH}
                  fill="none"
                  stroke={SEGMENT_COLORS[seg.type]}
                  strokeWidth={2}
                  rx={1}
                  className="seg-overlay"
                />
              );
            })()}

            {/* Elevation fill */}
            {pathData && <path d={pathData} fill="#94a3b8" opacity={0.35} className="seg-overlay" />}

            {/* Elevation line */}
            {decimatedPoints.length > 1 && (
              <polyline
                points={decimatedPoints.map((p) => `${toX(p.distance)},${toY(p.elevation)}`).join(' ')}
                fill="none" stroke="#334155" strokeWidth={1.5}
                className="seg-overlay"
              />
            )}

            {/* Mouse position guide */}
            {cursorX !== null && (
              <line
                x1={cursorX} y1={paddingTop}
                x2={cursorX} y2={paddingTop + chartH}
                stroke="#0f172a" strokeWidth={1}
                strokeDasharray="4 3" opacity={0.65}
                className="seg-overlay"
              />
            )}

            {/* Intersection marker */}
            {cursorX !== null && cursorMarkerY !== null && (
              <circle
                cx={cursorX} cy={cursorMarkerY}
                r={3.8}
                fill="#0f172a" stroke="#f8fafc" strokeWidth={1.2}
                className="seg-overlay"
              />
            )}

            {/* Km marker guide */}
            {hoveredKmDist !== null && (
              <line
                x1={toX(hoveredKmDist)} y1={paddingTop}
                x2={toX(hoveredKmDist)} y2={paddingTop + chartH}
                stroke="#64748b" strokeWidth={1}
                strokeDasharray="3 3" opacity={0.55}
              />
            )}

            {/* X-osa */}
            <line x1={0} y1={paddingTop + chartH} x2={chartW + paddingRight} y2={paddingTop + chartH} stroke="#475569" strokeWidth={1.5} />

            {/* X ticks */}
            {xTicks.map(({ x, label, major }, i) => (
              <g key={i}>
                <line
                  x1={x} y1={paddingTop + chartH}
                  x2={x} y2={paddingTop + chartH + (major ? 5 : 3)}
                  stroke="#475569" strokeWidth={major ? 1 : 0.75}
                />
                {label && (
                  <text x={x} y={paddingTop + chartH + 15} textAnchor={x === 0 ? 'start' : 'middle'} fontSize={10} fill="#64748b">{label}</text>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>

      <ElevationInfoBar
        cursorX={cursorX}
        cursorDist={cursorDist}
        cursorElev={cursorElev}
        cursorGrade={cursorGrade}
        segment={segment}
      />
    </div>
  );
};

export default ElevationChart;
