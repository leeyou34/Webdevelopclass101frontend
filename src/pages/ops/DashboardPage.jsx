import { useState } from "react";
import { Link as RouterLink } from "react-router";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { ops } from "../../api.js";
import { today, won } from "./labels.js";
import { addDays } from "./tasks.js";
import useLoad from "./useLoad.js";
import useOps from "./useOps.js";
import Notice from "./Notice.jsx";
import TrendChart from "./TrendChart.jsx";
import OpsTaskList from "./OpsTaskList.jsx";

const BLUE = "#2a78d6";
const ORANGE = "#eb6834";

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 기간 버튼 → [시작일, 종료일] */
function presetRange(key) {
  const now = new Date();
  const t = ymd(now);
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case "lastMonth":
      return [ymd(new Date(y, m - 1, 1)), ymd(new Date(y, m, 0))];
    case "3m":
      return [ymd(new Date(y, m - 2, 1)), t];
    case "year":
      return [`${y}-01-01`, t];
    case "12m":
      return [ymd(new Date(y, m - 11, 1)), t];
    default:
      return [ymd(new Date(y, m, 1)), t];
  }
}

const PRESETS = [
  ["month", "이번 달"],
  ["lastMonth", "지난달"],
  ["3m", "최근 3개월"],
  ["year", "올해"],
  ["12m", "최근 1년"],
  ["custom", "직접 설정"],
];

/** 금액을 축에 맞게 짧게: 1.2억, 350만 */
function shortWon(v) {
  if (v >= 100000000) return `${(v / 100000000).toFixed(v % 100000000 ? 1 : 0)}억`;
  if (v >= 10000) return `${Math.round(v / 10000).toLocaleString("ko-KR")}만`;
  return Number(v).toLocaleString("ko-KR");
}

/** 큰 금액을 읽기 쉽게: 1,263만원, 1.26억원 */
function bigWon(v) {
  const a = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (a >= 100000000) return `${sign}${(a / 100000000).toFixed(2).replace(/\.?0+$/, "")}억원`;
  if (a >= 100000) return `${sign}${Math.round(a / 10000).toLocaleString("ko-KR")}만원`;
  return won(v);
}

function Delta({ now, before, unit, money }) {
  if (before === undefined || before === null) return null;
  const diff = now - before;
  if (diff === 0) return <>지난 기간과 같음</>;
  const pct = before ? ` (${diff > 0 ? "+" : ""}${Math.round((diff / Math.abs(before)) * 100)}%)` : "";
  const amount = money ? bigWon(Math.abs(diff)) : `${Math.abs(diff).toLocaleString("ko-KR")}${unit}`;
  return (
    <>
      지난 기간 대비 {diff > 0 ? "▲" : "▼"} {amount}
      {pct}
    </>
  );
}

function Kpi({ label, value, sub, delta, exact }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }} title={exact}>
      <CardContent sx={{ "&:last-child": { pb: 2 } }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, my: 0.25 }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary" component="div">
            {sub}
          </Typography>
        )}
        {delta && (
          <Typography variant="caption" color="text.secondary" component="div">
            {delta}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function tooltipLabel(key, unit) {
  const [y, m, d] = key.split("-").map(Number);
  return unit === "day" ? `${y}년 ${m}월 ${d}일` : `${y}년 ${m}월`;
}

const METRICS = [
  ["units", "배송 대수"],
  ["revenue", "매출"],
  ["profit", "수익"],
  ["collected", "수금"],
];

export default function DashboardPage() {
  const [preset, setPreset] = useState("month");
  const [range, setRange] = useState(presetRange("month"));
  const [draft, setDraft] = useState(range);
  const [metric, setMetric] = useState("units");
  const [showTable, setShowTable] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const { data, error, reload } = useLoad(async () => {
    const [shops, analytics, dash, tasks] = await Promise.all([
      ops.shops(),
      ops.analytics(range[0], range[1]),
      ops.dashboard(),
      ops.tasks(),
    ]);
    return { shops, analytics, dash, tasks };
  }, [range[0], range[1]]);
  const { notice, setNotice, run } = useOps(reload);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress />;

  const { shops, analytics: a, dash, tasks } = data;

  if (shops.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          아직 등록된 영업장이 없습니다
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          체험 데이터를 만들면 가상의 영업장 8곳과 1년 치 업무(정상 처리된 달들, 반품·교환·AS·취소가 섞인 지난달, 신청을 받는 중인
          이번 달)가 채워집니다. 이름과 연락처는 모두 지어낸 값입니다.
        </Typography>
        <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
          <Button
            variant="contained"
            disabled={seeding}
            onClick={async () => {
              setSeeding(true);
              await run(() => ops.demo(), "체험 데이터를 만들었습니다.");
              setSeeding(false);
            }}
          >
            {seeding ? "만드는 중…" : "체험 데이터 만들기"}
          </Button>
          <Button component={RouterLink} to="/ops/shops">
            영업장 직접 등록
          </Button>
        </Stack>
        <Notice notice={notice} onClose={() => setNotice(null)} />
      </Paper>
    );
  }

  const s = a.summary;
  const p = a.previous;
  const units = (c) => c.android + c.ios;
  const margin = s.revenue ? Math.round((s.profit / s.revenue) * 100) : 0;

  const points = a.series.map((x) => ({
    key: x.key,
    label: x.label,
    tooltipLabel: tooltipLabel(x.key, a.unit),
    values: metric === "units" ? { android: x.android, ios: x.ios } : { v: x[metric] },
  }));
  const chartSeries =
    metric === "units"
      ? [
          { key: "android", label: "안드로이드", color: BLUE },
          { key: "ios", label: "iOS", color: ORANGE },
        ]
      : [{ key: "v", label: METRICS.find(([k]) => k === metric)[1], color: BLUE }];
  const fmt = metric === "units" ? (v) => `${v}대` : won;
  const axisFmt = metric === "units" ? (v) => (Number.isInteger(v) ? `${v}` : "") : shortWon;

  const t = tasks.asOf || today();
  const soon = tasks.tasks.filter((x) => x.dueOn <= addDays(t, 7));
  const topShops = a.byShop.slice(0, 8);
  const shopMax = Math.max(1, ...topShops.map((r) => r.android + r.ios));

  return (
    <Stack spacing={3}>
      {/* 기간 선택 */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
            현황
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {a.from} ~ {a.to} · 비교: {a.previousFrom} ~ {a.previousTo}
          </Typography>
        </Box>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={preset}
          onChange={(_, v) => {
            if (!v) return;
            setPreset(v);
            if (v !== "custom") {
              const r = presetRange(v);
              setRange(r);
              setDraft(r);
            }
          }}
          aria-label="기간"
          sx={{ flexWrap: "wrap" }}
        >
          {PRESETS.map(([k, l]) => (
            <ToggleButton key={k} value={k}>
              {l}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      {preset === "custom" && (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
          <TextField
            size="small"
            type="date"
            label="시작일"
            value={draft[0]}
            onChange={(e) => setDraft([e.target.value, draft[1]])}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Typography>~</Typography>
          <TextField
            size="small"
            type="date"
            label="종료일"
            value={draft[1]}
            onChange={(e) => setDraft([draft[0], e.target.value])}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button variant="contained" disabled={!draft[0] || !draft[1] || draft[0] > draft[1]} onClick={() => setRange(draft)}>
            보기
          </Button>
        </Stack>
      )}

      {/* 기간 합계 */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 4, lg: 2 }}>
          <Kpi
            label="배송 대수"
            value={`${units(s.delivered)}대`}
            sub={`안드로이드 ${s.delivered.android} · iOS ${s.delivered.ios}`}
            delta={<Delta now={units(s.delivered)} before={units(p.delivered)} unit="대" />}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 4, lg: 2 }}>
          <Kpi label="매출" value={bigWon(s.revenue)} exact={won(s.revenue)} sub="배송 완료 기준" delta={<Delta now={s.revenue} before={p.revenue} money />} />
        </Grid>
        <Grid size={{ xs: 6, md: 4, lg: 2 }}>
          <Kpi label="수익" value={bigWon(s.profit)} exact={won(s.profit)} sub={`수익률 ${margin}%`} delta={<Delta now={s.profit} before={p.profit} money />} />
        </Grid>
        <Grid size={{ xs: 6, md: 4, lg: 2 }}>
          <Kpi label="수금" value={bigWon(s.collected)} exact={won(s.collected)} sub="개인 입금 + 본사 수금" delta={<Delta now={s.collected} before={p.collected} money />} />
        </Grid>
        <Grid size={{ xs: 6, md: 4, lg: 2 }}>
          <Kpi
            label="신청"
            value={`${s.requests}건`}
            sub={`취소 ${s.cancelled}건`}
            delta={<Delta now={s.requests} before={p.requests} unit="건" />}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 4, lg: 2 }}>
          <Kpi
            label="사후 처리 접수"
            value={`${s.returns + s.exchanges + s.repairs}건`}
            sub={`반품 ${s.returns} · 교환 ${s.exchanges} · AS ${s.repairs}`}
          />
        </Grid>
      </Grid>

      {/* 추이 */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} sx={{ alignItems: { sm: "center" }, mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
            {a.unit === "day" ? "일별" : "월별"} 추이
          </Typography>
          <Tabs value={metric} onChange={(_, v) => setMetric(v)} variant="scrollable" scrollButtons="auto">
            {METRICS.map(([k, l]) => (
              <Tab key={k} value={k} label={l} sx={{ minWidth: 72 }} />
            ))}
          </Tabs>
          <Button size="small" onClick={() => setShowTable((v) => !v)}>
            {showTable ? "그래프로 보기" : "표로 보기"}
          </Button>
        </Stack>
        {showTable ? (
          <Box sx={{ maxHeight: 280, overflow: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>{a.unit === "day" ? "날짜" : "월"}</TableCell>
                  <TableCell align="right">안드로이드</TableCell>
                  <TableCell align="right">iOS</TableCell>
                  <TableCell align="right">매출</TableCell>
                  <TableCell align="right">수익</TableCell>
                  <TableCell align="right">수금</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {a.series.map((x) => (
                  <TableRow key={x.key}>
                    <TableCell>{tooltipLabel(x.key, a.unit)}</TableCell>
                    <TableCell align="right">{x.android}</TableCell>
                    <TableCell align="right">{x.ios}</TableCell>
                    <TableCell align="right">{won(x.revenue)}</TableCell>
                    <TableCell align="right">{won(x.profit)}</TableCell>
                    <TableCell align="right">{won(x.collected)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        ) : (
          <TrendChart
            title={`${METRICS.find(([k]) => k === metric)[1]} 추이`}
            points={points}
            series={chartSeries}
            format={fmt}
            axisFormat={axisFmt}
          />
        )}
      </Paper>

      <Grid container spacing={2}>
        {/* 영업장 순위 */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ height: "100%" }}>
            <Typography variant="subtitle1" sx={{ px: 2, pt: 2, fontWeight: 700 }}>
              영업장별 배송 (이 기간)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>영업장</TableCell>
                  <TableCell>대수</TableCell>
                  <TableCell align="right">매출</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topShops.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ color: "text.secondary", py: 3 }}>
                      이 기간에 배송된 건이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
                {topShops.map((r) => {
                  const n = r.android + r.ios;
                  return (
                    <TableRow key={r.shopCode}>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{r.shopName}</TableCell>
                      <TableCell sx={{ width: "45%" }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <Box sx={{ height: 8, borderRadius: "0 4px 4px 0", bgcolor: BLUE, width: `${(n / shopMax) * 100}%`, minWidth: 4 }} />
                          <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                            {n}대
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{won(r.revenue)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* 지금 상태 (기간과 무관) */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ height: "100%", p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              지금 상태 <Typography component="span" variant="caption" color="text.secondary">({dash.asOf} 기준)</Typography>
            </Typography>
            {[
              ["재고", `${units(dash.stock)}대 (안드로이드 ${dash.stock.android} · iOS ${dash.stock.ios})`],
              ["본사 미수", `${won(dash.receivablesAmount)} · ${dash.receivablesCount}건`, dash.overdueCount > 0 && `기한 넘김 ${dash.overdueCount}건 ${won(dash.overdueAmount)}`],
              ["환불 대기", won(dash.pendingRefunds)],
              ["교환 회수 대기", `${dash.unrecoveredExchanges}건`],
              ["AS 진행 중", `${dash.openRepairs}건`],
            ].map(([k, v, warn]) => (
              <Stack key={k} direction="row" sx={{ py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="body2" color="text.secondary" sx={{ width: 110, flexShrink: 0 }}>
                  {k}
                </Typography>
                <Box>
                  <Typography variant="body2">{v}</Typography>
                  {warn && (
                    <Typography variant="caption" color="error.main">
                      ⚠ {warn}
                    </Typography>
                  )}
                </Box>
              </Stack>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* 다가오는 일 */}
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <Stack direction="row" sx={{ px: 2, pt: 2, pb: 1, alignItems: "center" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
            밀린 일과 7일 안에 할 일 ({soon.length}건)
          </Typography>
          <Button size="small" component={RouterLink} to="/">
            할 일 전체 보기
          </Button>
        </Stack>
        <OpsTaskList tasks={soon} today={t} dense />
      </Paper>
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </Stack>
  );
}
