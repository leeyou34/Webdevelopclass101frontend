import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  Alert,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { ops } from "../../api.js";
import { thisMonth, won } from "./labels.js";
import Notice from "./Notice.jsx";
import useLoad from "./useLoad.js";
import useOps from "./useOps.js";

function Figure({ label, value, sub }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

const prevMonth = () => {
  const [y, m] = thisMonth().split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function ReportPage() {
  const [params] = useSearchParams();
  const [month, setMonth] = useState(params.get("month") || prevMonth());
  const { data, error, reload } = useLoad(() => ops.report(month), [month]);
  const { notice, setNotice, run } = useOps(reload);

  const units = (c) => `${c.android + c.ios}대`;
  const split = (c) => `안드로이드 ${c.android} · iOS ${c.ios}`;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
        <TextField
          size="small"
          type="month"
          label="마감 월"
          value={month}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
          영업 기준은 그 달에 배송 완료된 대수, 회계 기준은 그 달에 계산서가 발행된 대수입니다. 수익은 그 달 신청분의 판매가에서 매입가를 뺀 값입니다.
        </Typography>
        <Button
          variant="contained"
          disabled={!data}
          onClick={() => run(() => ops.act(`/printer/months/${month}/close`), `${month} 월 마감을 기록했습니다.`)}
        >
          월 마감 기록 (동작 21)
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {!data && !error && <CircularProgress />}
      {data && (
        <>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Figure label="영업 기준(배송 완료)" value={units(data.salesBasis)} sub={split(data.salesBasis)} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Figure label="회계 기준(계산서 발행)" value={units(data.accountingBasis)} sub={split(data.accountingBasis)} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Figure label="매출 / 매입" value={won(data.revenue)} sub={`매입 ${won(data.cost)}`} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Figure label="수익" value={won(data.profit)} sub={data.adjustments ? `정산 조정 ${won(data.adjustments)}` : "정산 조정 없음"} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Figure label="취소" value={`${data.cancelled}건`} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Figure label="반품" value={`${data.returns}건`} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Figure label="불량 교환" value={`${data.exchanges}건`} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Figure label="AS" value={`${data.repairs}건`} />
            </Grid>
          </Grid>

          <Paper variant="outlined">
            <Typography variant="subtitle1" sx={{ px: 2, pt: 2, fontWeight: 700 }}>
              영업장별 신청 수량 ({data.month})
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>코드</TableCell>
                    <TableCell>영업장</TableCell>
                    <TableCell align="right">안드로이드</TableCell>
                    <TableCell align="right">iOS</TableCell>
                    <TableCell align="right">합계</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.byShop.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: 3 }}>
                        이 달의 신청이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                  {data.byShop.map((r) => (
                    <TableRow key={r.shopCode}>
                      <TableCell>{r.shopCode}</TableCell>
                      <TableCell>{r.shopName}</TableCell>
                      <TableCell align="right">{r.android}</TableCell>
                      <TableCell align="right">{r.ios}</TableCell>
                      <TableCell align="right">{r.android + r.ios}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </Stack>
  );
}
