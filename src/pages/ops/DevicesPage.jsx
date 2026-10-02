import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {
  Alert,
  Button,
  CircularProgress,
  MenuItem,
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

/** 할 일에서 눌러 넘어온 줄 표시 */
const FOCUS = { "&.Mui-selected, &.Mui-selected:hover": { bgcolor: "#fff1e8", boxShadow: "inset 4px 0 0 #eb6834" } };
import { CASE_STATUS, CASE_TYPE, DEVICE_STATUS, MODEL, today } from "./labels.js";
import ActionDialog from "./ActionDialog.jsx";
import StatusChip from "./StatusChip.jsx";
import Notice from "./Notice.jsx";
import useLoad from "./useLoad.js";
import useOps from "./useOps.js";

const dateField = (label) => ({ name: "date", label, type: "date", default: today() });

export default function DevicesPage() {
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const { data, error, reload } = useLoad(async () => {
    const [devices, cases, shops, requests] = await Promise.all([ops.devices(), ops.cases(), ops.shops(), ops.requests()]);
    return { devices, cases, shops, requests };
  });
  const { notice, setNotice, run } = useOps(reload);
  const [dialog, setDialog] = useState(null);
  const [params] = useSearchParams();
  const focus = params.get("focus");
  useEffect(() => {
    if (focus && data) document.getElementById(`row-${focus}`)?.scrollIntoView?.({ block: "center", behavior: "smooth" });
  }, [focus, data]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress />;

  const shopName = Object.fromEntries(data.shops.map((s) => [s.id, s.name]));
  const applicant = Object.fromEntries(data.requests.map((r) => [r.id, r.applicantName]));
  const ask = (config, perform, successText) =>
    setDialog({ ...config, onSubmit: (values) => run(() => perform(values), successText) });

  const counts = {};
  for (const d of data.devices) counts[d.status] = (counts[d.status] || 0) + 1;
  const q = query.trim().toUpperCase();
  const devices = data.devices
    .filter((d) => !filter || d.status === filter)
    .filter((d) => !q || d.serial.includes(q) || (shopName[d.shopId] || "").includes(query.trim()));

  function deviceButtons(d) {
    if (d.status !== "DELIVERED") return null;
    const who = `${d.serial} · ${shopName[d.shopId] || ""} ${applicant[d.requestId] || ""}`;
    const path = `/printer/devices/${encodeURIComponent(d.serial)}`;
    return (
      <Stack direction="row" spacing={0.5}>
        <Button
          size="small"
          onClick={() =>
            ask(
              {
                title: "반품 접수 (동작 17)",
                description: `${who}. 기기를 회수하면 재고로 돌아가고, 신청 금액에서 1대분이 빠져 환불 대기로 잡힙니다.`,
                fields: [{ name: "reason", label: "반품 사유" }, dateField("접수일")],
                submitLabel: "접수",
              },
              (v) => ops.act(`${path}/return`, v),
              "반품을 접수했습니다. 기기가 도착하면 회수 확인을 누르세요.",
            )
          }
        >
          반품
        </Button>
        <Button
          size="small"
          onClick={() =>
            ask(
              {
                title: "불량 교환 (동작 19)",
                description: `${who}. 같은 기종 재고를 먼저 보내고, 불량 기기는 회수 대기로 둡니다.`,
                fields: [
                  { name: "reason", label: "불량 내용", default: "기기 불량" },
                  { name: "newSerial", label: "보낼 시리얼(비우면 자동)" },
                  dateField("교환 출고일"),
                ],
                submitLabel: "교환 출고",
              },
              (v) => ops.act(`${path}/exchange`, v),
              "교환 기기를 보냈습니다.",
            )
          }
        >
          교환
        </Button>
        <Button
          size="small"
          onClick={() =>
            ask(
              {
                title: "AS 접수 (동작 20)",
                description: `${who}. 생산일로부터 2년 안이면 무상으로 표시됩니다.`,
                fields: [{ name: "reason", label: "증상" }, dateField("접수일")],
                submitLabel: "접수",
              },
              (v) => ops.act(`${path}/repair`, v),
              "AS를 접수했습니다.",
            )
          }
        >
          AS
        </Button>
      </Stack>
    );
  }

  function caseButtons(k) {
    if (k.status !== "OPEN") return null;
    if (k.type === "REPAIR")
      return (
        <Button
          size="small"
          variant="contained"
          onClick={() =>
            ask(
              {
                title: "수리 결과 (동작 20)",
                fields: [
                  { name: "repaired", label: "결과", type: "select", options: [["true", "수리 완료"], ["false", "수리 불가(폐기)"]], default: "true" },
                  dateField("완료일"),
                ],
                submitLabel: "등록",
              },
              (v) => ops.act(`/printer/cases/${k.id}/repair-result`, { ...v, repaired: v.repaired === "true" }),
              "수리 결과를 등록했습니다.",
            )
          }
        >
          수리 결과
        </Button>
      );
    return (
      <Button
        size="small"
        variant="contained"
        onClick={() =>
          ask(
            {
              title: "회수 확인 (동작 17·19)",
              description: k.type === "RETURN" ? "반품 기기가 도착했으면 재고로 돌립니다." : "불량 기기를 돌려받았는지 확인합니다.",
              fields: [dateField("회수일")],
              submitLabel: "회수 확인",
            },
            (v) => ops.act(`/printer/cases/${k.id}/recover`, v),
            "회수를 확인했습니다.",
          )
        }
      >
        회수 확인
      </Button>
    );
  }

  return (
    <Stack spacing={3}>
      <Paper variant="outlined">
        <Typography variant="subtitle1" sx={{ px: 2, pt: 2, fontWeight: 700 }}>
          반품·교환·AS
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>구분</TableCell>
                <TableCell>시리얼</TableCell>
                <TableCell>영업장 · 신청자</TableCell>
                <TableCell>사유</TableCell>
                <TableCell>접수일</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>동작</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.cases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 3 }}>
                    접수된 건이 없습니다. 아래 기기 목록에서 사용 중인 기기의 반품·교환·AS를 접수합니다.
                  </TableCell>
                </TableRow>
              )}
              {data.cases.map((k) => (
                <TableRow key={k.id} id={`row-${k.id}`} selected={focus === k.id} sx={FOCUS}>
                  <TableCell>
                    {CASE_TYPE[k.type]}
                    {k.type === "REPAIR" && k.freeWarranty != null ? (k.freeWarranty ? " (무상)" : " (유상)") : ""}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace" }}>
                    {k.serial}
                    {k.newSerial ? ` → ${k.newSerial}` : ""}
                  </TableCell>
                  <TableCell>
                    {shopName[k.shopId]} {applicant[k.requestId]}
                  </TableCell>
                  <TableCell>{k.reason}</TableCell>
                  <TableCell>{k.openedOn}</TableCell>
                  <TableCell>
                    <StatusChip map={CASE_STATUS} value={k.status} />
                  </TableCell>
                  <TableCell>{caseButtons(k)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper variant="outlined">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ p: 2, alignItems: { sm: "center" } }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
            기기 {data.devices.length}대
          </Typography>
          <TextField size="small" label="시리얼·영업장 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
          <TextField select size="small" label="상태" value={filter} onChange={(e) => setFilter(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">전체</MenuItem>
            {Object.entries(DEVICE_STATUS).map(([k, [label]]) => (
              <MenuItem key={k} value={k}>
                {label} ({counts[k] || 0})
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <TableContainer sx={{ maxHeight: 520 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>시리얼</TableCell>
                <TableCell>기종</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>영업장 · 신청자</TableCell>
                <TableCell>입고일</TableCell>
                <TableCell>수령일</TableCell>
                <TableCell>동작</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell sx={{ fontFamily: "monospace" }}>{d.serial}</TableCell>
                  <TableCell>{MODEL[d.model]}</TableCell>
                  <TableCell>
                    <StatusChip map={DEVICE_STATUS} value={d.status} />
                  </TableCell>
                  <TableCell>
                    {shopName[d.shopId] || ""} {applicant[d.requestId] || ""}
                  </TableCell>
                  <TableCell>{d.receivedOn}</TableCell>
                  <TableCell>{d.deliveredOn || ""}</TableCell>
                  <TableCell>{deviceButtons(d)}</TableCell>
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
