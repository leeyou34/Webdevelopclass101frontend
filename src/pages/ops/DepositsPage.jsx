import { useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
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
import { today, withVat, won } from "./labels.js";
import ActionDialog from "./ActionDialog.jsx";
import Notice from "./Notice.jsx";
import useLoad from "./useLoad.js";
import useOps from "./useOps.js";

const SAMPLE = "2017-08-03\t한빛서0윤\t157,300\n2017-08-03\t새봄문0희\t157,300";

/** 통장 입금 내역 대조: 붙여 넣으면 금액·입금자명으로 신청 건을 찾아 입금 확인까지 처리 */
export default function DepositsPage() {
  const { data, error, reload } = useLoad(async () => {
    const [deposits, requests, shops] = await Promise.all([ops.deposits(), ops.requests(), ops.shops()]);
    return { deposits, requests, shops };
  });
  const { notice, setNotice, run } = useOps(reload);
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [dialog, setDialog] = useState(null);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress />;

  const shopName = Object.fromEntries(data.shops.map((s) => [s.id, s.name]));
  const reqName = Object.fromEntries(data.requests.map((r) => [r.id, `${shopName[r.shopId] || ""} ${r.applicantName}`]));
  const waiting = data.requests.filter((r) => r.status === "APPLIED" && r.personalAmount > 0);
  const unmatched = data.deposits.filter((d) => !d.requestId);

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          통장 입금 내역 붙여 넣기
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          인터넷뱅킹 거래내역을 엑셀로 받아 날짜·입금자·금액 칸을 복사해 붙여 넣으세요. 금액(VAT 포함)이 같고 입금자명에 신청자 이름이 들어 있는 신청이 하나뿐이면 자동으로 입금 확인합니다.
          동명이인은 입금자명의 영업장명으로 가립니다. 맞추지 못한 입금은 아래 "미확인 입금"에 남습니다.
        </Typography>
        <TextField
          multiline
          minRows={4}
          fullWidth
          placeholder={SAMPLE}
          value={text}
          onChange={(e) => setText(e.target.value)}
          slotProps={{ htmlInput: { style: { fontFamily: "monospace", fontSize: 13 } } }}
        />
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: "center" }}>
          <Button
            variant="contained"
            disabled={!text.trim()}
            onClick={async () => {
              let res = null;
              const ok = await run(async () => {
                res = await ops.act("/printer/deposits/import", { text, defaultDate: today() });
              }, "입금 내역을 대조했습니다.");
              if (ok) {
                setResult(res);
                setText("");
              }
            }}
          >
            대조하기
          </Button>
          {result && (
            <Typography variant="body2">
              {result.created}건 중 <b>{result.matched}건 자동 입금 확인</b>, 미확인 {result.unmatched}건
            </Typography>
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined">
        <Typography variant="subtitle1" sx={{ px: 2, pt: 2, fontWeight: 700 }}>
          미확인 입금 {unmatched.length}건
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>입금일</TableCell>
                <TableCell>입금자</TableCell>
                <TableCell align="right">금액</TableCell>
                <TableCell>메모</TableCell>
                <TableCell>동작</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {unmatched.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: 3 }}>
                    확인 못 한 입금이 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {unmatched.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.depositedOn}</TableCell>
                  <TableCell>{d.depositorName}</TableCell>
                  <TableCell align="right">{won(d.amount)}</TableCell>
                  <TableCell>{d.note}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={waiting.length === 0}
                      onClick={() =>
                        setDialog({
                          title: "신청 건에 연결",
                          description: `${d.depositedOn} ${d.depositorName} ${won(d.amount)}을 어느 신청의 입금으로 볼지 고르세요. 금액이 맞는 신청이 위에 옵니다.`,
                          fields: [
                            {
                              name: "requestId",
                              label: "신청 건",
                              type: "select",
                              options: [...waiting]
                                .sort((a, b) => (withVat(b.personalAmount) === d.amount) - (withVat(a.personalAmount) === d.amount))
                                .map((r) => [r.id, `${reqName[r.id]} · ${won(withVat(r.personalAmount))}${withVat(r.personalAmount) === d.amount ? " ✓" : ""}`]),
                            },
                          ],
                          submitLabel: "연결",
                          onSubmit: (v) => run(() => ops.act(`/printer/deposits/${d.id}/match`, v), "입금 확인으로 연결했습니다."),
                        })
                      }
                    >
                      신청 연결
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper variant="outlined">
        <Typography variant="subtitle1" sx={{ px: 2, pt: 2, fontWeight: 700 }}>
          대조한 입금 기록
        </Typography>
        <TableContainer sx={{ maxHeight: 360 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>입금일</TableCell>
                <TableCell>입금자</TableCell>
                <TableCell align="right">금액</TableCell>
                <TableCell>연결된 신청</TableCell>
                <TableCell>방법</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.deposits
                .filter((d) => d.requestId)
                .map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.depositedOn}</TableCell>
                    <TableCell>{d.depositorName}</TableCell>
                    <TableCell align="right">{won(d.amount)}</TableCell>
                    <TableCell>{reqName[d.requestId]}</TableCell>
                    <TableCell>{d.note}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <ActionDialog open={Boolean(dialog)} {...(dialog || {})} onClose={() => setDialog(null)} />
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </Stack>
  );
}
