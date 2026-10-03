import { useEffect, useRef, useState } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";

/**
 * 막대 추이 그래프(쌓기 지원). 축은 하나, 막대는 얇게(최대 24px), 끝만 둥글게, 쌓인 칸 사이 2px 틈.
 * points: [{ key, label, values: { [seriesKey]: number } }]
 * series: [{ key, label, color }]
 */
const H = 220;
const PAD = { top: 12, right: 8, bottom: 28, left: 52 };

function niceMax(v) {
  if (v <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * exp >= v) return m * exp;
  return 10 * exp;
}

function topRoundedRect(x, y, w, h, r) {
  if (h <= 0) return "";
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

export default function TrendChart({ points, series, format, axisFormat, title }) {
  const wrap = useRef(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totals = points.map((p) => series.reduce((s, x) => s + (p.values[x.key] || 0), 0));
  const max = niceMax(Math.max(0, ...totals));
  const plotW = width - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const band = plotW / Math.max(1, points.length);
  const barW = Math.max(2, Math.min(24, band * 0.62));
  const y = (v) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const every = Math.max(1, Math.ceil(points.length / Math.max(1, Math.floor(plotW / 52))));
  const af = axisFormat || format;

  return (
    <Box ref={wrap} sx={{ position: "relative", width: "100%" }}>
      {series.length > 1 && (
        <Stack direction="row" spacing={2} sx={{ mb: 1 }} aria-label={`${title} 범례`}>
          {series.map((s) => (
            <Stack key={s.key} direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: s.color }} />
              <Typography variant="caption" color="text.secondary">
                {s.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
      <svg width={width} height={H} role="img" aria-label={title} style={{ display: "block" }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="#e4e6ea" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="#6b6f76">
              {af(t)}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const cx = PAD.left + band * i + band / 2;
          const x = cx - barW / 2;
          let acc = 0;
          const stack = series.map((s) => ({ s, v: p.values[s.key] || 0 })).filter((d) => d.v > 0);
          return (
            <g key={p.key}>
              {stack.map((d, j) => {
                const y0 = y(acc);
                acc += d.v;
                const y1 = y(acc);
                const gap = j > 0 ? 2 : 0;
                const h = Math.max(0, y0 - y1 - gap);
                const top = j === stack.length - 1;
                return top ? (
                  <path key={d.s.key} d={topRoundedRect(x, y1, barW, h, 4)} fill={d.s.color} />
                ) : (
                  <rect key={d.s.key} x={x} y={y1} width={barW} height={h} fill={d.s.color} />
                );
              })}
              {i % every === 0 && (
                <text x={cx} y={H - 8} textAnchor="middle" fontSize={11} fill="#6b6f76">
                  {p.label}
                </text>
              )}
              <rect
                x={PAD.left + band * i}
                y={PAD.top}
                width={band}
                height={plotH}
                fill={hover === i ? "rgba(31,58,95,0.06)" : "transparent"}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${p.label} ${series.map((s) => `${s.label} ${format(p.values[s.key] || 0)}`).join(", ")}`}
              />
            </g>
          );
        })}
        <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke="#b9bdc4" strokeWidth={1} />
      </svg>
      {hover !== null && points[hover] && (
        <Paper
          elevation={3}
          sx={{
            position: "absolute",
            pointerEvents: "none",
            top: 28,
            left: Math.min(Math.max(0, PAD.left + band * hover + band / 2 - 80), width - 170),
            px: 1.5,
            py: 1,
            minWidth: 160,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            {points[hover].tooltipLabel || points[hover].label}
          </Typography>
          {series.map((s) => (
            <Stack key={s.key} direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 10, height: 2, bgcolor: s.color }} />
              <Typography variant="caption" sx={{ flexGrow: 1 }}>
                {s.label}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {format(points[hover].values[s.key] || 0)}
              </Typography>
            </Stack>
          ))}
          {series.length > 1 && (
            <Typography variant="caption" color="text.secondary" component="div" sx={{ textAlign: "right" }}>
              합계 {format(totals[hover])}
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
}
