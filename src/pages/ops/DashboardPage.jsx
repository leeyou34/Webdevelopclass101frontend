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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ErrorOutlineIcon from "@mui/icons-material/Error";
import { ops } from "../../api.js";
import { REQUEST_STATUS, won } from "./labels.js";
import useLoad from "./useLoad.js";
import useOps from "./useOps.js";
import Notice from "./Notice.jsx";

const ICON = {
  danger: <ErrorOutlineIcon color="error" />,
  warning: <WarningAmberIcon color="warning" />,
  info: <InfoOutlinedIcon color="info" />,
  action: <InfoOutlinedIcon color="primary" />,
};

const LINK = { request: "/ops/orders", cycle: "/ops/orders", invoice: "/ops/orders", device: "/ops/devices", case: "/ops/devices" };

function Tile({ label, value, sub, tone }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: tone ? `${tone}.main` : undefined }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

const units = (c) => `${(c?.android ?? 0) + (c?.ios ?? 0)}대`;
const split = (c) => `안드로이드 ${c?.android ?? 0} · iOS ${c?.ios ?? 0}`;

export default function DashboardPage() {
  const { data, error, reload } = useLoad(async () => {
    const [dash, shops] = await Promise.all([ops.dashboard(), ops.shops()]);
    return { dash, shops };
  });
  const { notice, setNotice, run } = useOps(reload);
  const [seeding, setSeeding] = useState(false);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress />;

  const { dash, shops } = data;

  if (shops.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          아직 등록된 영업장이 없습니다
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          체험 데이터를 만들면 가상의 영업장 8곳과 석 달 치 업무(정상 처리된 달, 반품·교환·AS·취소가 섞인 달, 신청을 받는 중인 달)가
          채워집니다. 이름과 연락처는 모두 지어낸 값입니다.
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

  const byStatus = dash.requestsByStatus || {};
  const statusLine = Object.entries(byStatus)
    .filter(([, n]) => n > 0)
    .map(([s, n]) => `${REQUEST_STATUS[s]?.[0] ?? s} ${n}`)
    .join(" · ");

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
          {dash.month} 현황
        </Typography>
        <Typography variant="body2" color="text.secondary">
          기준일 {dash.asOf} · 이번 달 신청 {statusLine || "없음"}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Tile label="이번 달 배송 완료" value={units(dash.deliveredThisMonth)} sub={split(dash.deliveredThisMonth)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Tile label="이번 달 계산서 발행" value={units(dash.invoicedThisMonth)} sub={split(dash.invoicedThisMonth)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Tile label="재고" value={units(dash.stock)} sub={split(dash.stock)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Tile
            label="본사 미수"
            value={won(dash.receivablesAmount)}
            sub={`${dash.receivablesCount}건 · 기한 넘김 ${dash.overdueCount}건 ${won(dash.overdueAmount)}`}
            tone={dash.overdueCount > 0 ? "error" : undefined}
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Tile label="교환 회수 대기" value={`${dash.unrecoveredExchanges}건`} tone={dash.unrecoveredExchanges ? "warning" : undefined} />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Tile label="AS 진행 중" value={`${dash.openRepairs}건`} tone={dash.openRepairs ? "warning" : undefined} />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Tile label="환불 대기" value={won(dash.pendingRefunds)} tone={dash.pendingRefunds ? "warning" : undefined} />
        </Grid>
      </Grid>

      <Paper variant="outlined">
        <Typography variant="subtitle1" sx={{ px: 2, pt: 2, fontWeight: 700 }}>
          지금 챙길 일
        </Typography>
        {dash.suggestions.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 2 }}>
            밀린 일이 없습니다.
          </Typography>
        ) : (
          <List dense>
            {dash.suggestions.map((s, i) => (
              <ListItem
                key={i}
                secondaryAction={
                  LINK[s.targetType] && (
                    <Button size="small" component={RouterLink} to={LINK[s.targetType]}>
                      처리하러 가기
                    </Button>
                  )
                }
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{ICON[s.level] || ICON.info}</ListItemIcon>
                <ListItemText primary={s.message} />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </Stack>
  );
}
