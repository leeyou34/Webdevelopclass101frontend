import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
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
  Typography,
} from "@mui/material";
import { ops } from "../../api.js";
import { DEVICE_STATUS, MODEL, REQUEST_STATUS, modelOfSerial, today } from "./labels.js";
import BarcodeInput from "./BarcodeInput.jsx";
import StatusChip from "./StatusChip.jsx";
import Notice from "./Notice.jsx";
import useLoad from "./useLoad.js";
import useOps from "./useOps.js";

const SERIAL = /^[A-Z0-9]{7}\d{2}\d{2}\d{3,}$/;

// ------------------------------------------------------------------ 조회
function LookupTab() {
  const [found, setFound] = useState(null);
  const [error, setError] = useState("");

  async function find(code) {
    setError("");
    try {
      setFound(await ops.lookup(code.toUpperCase()));
      return true;
    } catch (err) {
      setFound(null);
      setError(err.message);
      return false;
    }
  }

  const d = found?.device;
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        기기 라벨의 시리얼 바코드를 찍으면 상태, 받은 영업장, 신청자, 발주 번호, 무상 AS 기간, 사후 처리 이력을 바로 보여 줍니다. 반품·AS 전화를 받을 때 씁니다.
      </Typography>
      <BarcodeInput label="시리얼" placeholder="예: AMR7OKA17080001" onCode={find} />
      {error && <Alert severity="error">{error}</Alert>}
      {d && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
            <Typography variant="h6" sx={{ fontFamily: "monospace" }}>
              {d.serial}
            </Typography>
            <Chip size="small" label={MODEL[d.model]} />
            <StatusChip map={DEVICE_STATUS} value={d.status} />
          </Stack>
          <Box component="dl" sx={{ display: "grid", gridTemplateColumns: "120px 1fr", rowGap: 0.5, m: 0, mt: 1.5 }}>
            {[
              ["영업장", found.shop?.name || "—"],
              ["신청자", found.request?.applicantName || "—"],
              ["발주 번호", found.purchaseOrder?.orderNo || "—"],
              ["입고일", d.receivedOn || "—"],
              ["수령일", d.deliveredOn || "—"],
              ["무상 AS", d.producedOn ? `${addYears(d.producedOn, 2)}까지` : "—"],
              ["사후 처리", found.cases.length ? `${found.cases.length}건` : "없음"],
            ].map(([k, v]) => (
              <Box key={k} sx={{ display: "contents" }}>
                <Typography component="dt" variant="body2" color="text.secondary">
                  {k}
                </Typography>
                <Typography component="dd" variant="body2" sx={{ m: 0 }}>
                  {v}
                </Typography>
              </Box>
            ))}
          </Box>
          <Button size="small" component={RouterLink} to={`/ops/devices?q=${d.serial}`} sx={{ mt: 1 }}>
            기기 화면에서 반품·교환·AS 처리
          </Button>
        </Paper>
      )}
    </Stack>
  );
}

function addYears(date, n) {
  const [y, m, d] = date.split("-").map(Number);
  return `${y + n}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// ------------------------------------------------------------------ 입고
function ReceiveTab() {
  const { data, error, reload } = useLoad(() => ops.purchaseOrders());
  const { notice, setNotice, run } = useOps(reload);
  const [poId, setPoId] = useState("");
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState(null);

  const open = (data || []).filter((o) => o.androidQty + o.iosQty > o.receivedAndroid + o.receivedIos);
  const po = open.find((o) => o.id === poId) || open[0];
  useEffect(() => setList([]), [po?.id]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress />;
  if (!po) return <Alert severity="info">입고를 기다리는 발주가 없습니다.</Alert>;

  const leftA = po.androidQty - po.receivedAndroid - list.filter((s) => modelOfSerial(s) === "ANDROID").length;
  const leftI = po.iosQty - po.receivedIos - list.filter((s) => modelOfSerial(s) === "IOS").length;

  function add(code) {
    const s = code.toUpperCase();
    const model = modelOfSerial(s);
    if (!SERIAL.test(s) || !model) {
      setMsg({ severity: "error", text: `시리얼 형식이 아닙니다: ${s}` });
      return false;
    }
    if (list.includes(s)) {
      setMsg({ severity: "warning", text: `이미 찍은 시리얼입니다: ${s}` });
      return false;
    }
    if ((model === "ANDROID" ? leftA : leftI) <= 0) {
      setMsg({ severity: "error", text: `${MODEL[model]}은 발주 수량을 이미 다 찍었습니다.` });
      return false;
    }
    setList((l) => [s, ...l]);
    setMsg({ severity: "success", text: `${MODEL[model]} ${s}` });
    return true;
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        빅솔론에서 기기가 도착하면 상자의 시리얼 바코드를 차례로 찍습니다. 기종은 시리얼 앞자리로 자동 구분하고, 발주 수량을 넘거나 중복되면 막습니다.
      </Typography>
      <TextField select size="small" label="발주" value={po.id} onChange={(e) => setPoId(e.target.value)} sx={{ maxWidth: 360 }}>
        {open.map((o) => (
          <MenuItem key={o.id} value={o.id}>
            {o.orderNo} · 남은 안드로이드 {o.androidQty - o.receivedAndroid} / iOS {o.iosQty - o.receivedIos}
          </MenuItem>
        ))}
      </TextField>
      <BarcodeInput label="시리얼" onCode={add} />
      {msg && <Alert severity={msg.severity}>{msg.text}</Alert>}
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
        <Typography>
          찍은 기기 <b>{list.length}</b>대 · 남은 안드로이드 {leftA} · iOS {leftI}
        </Typography>
        <Button
          variant="contained"
          disabled={!list.length}
          onClick={async () => {
            const ok = await run(
              () => ops.act(`/printer/purchase-orders/${po.id}/receipts`, { date: today(), serials: [...list].reverse() }),
              `${list.length}대를 입고했습니다.`,
            );
            if (ok) setList([]);
          }}
        >
          입고 등록
        </Button>
        {list.length > 0 && <Button onClick={() => setList([])}>모두 지우기</Button>}
      </Stack>
      {list.length > 0 && (
        <Paper variant="outlined" sx={{ maxHeight: 260, overflow: "auto", p: 1 }}>
          {list.map((s) => (
            <Chip key={s} label={s} size="small" onDelete={() => setList((l) => l.filter((x) => x !== s))} sx={{ m: 0.25, fontFamily: "monospace" }} />
          ))}
        </Paper>
      )}
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </Stack>
  );
}

// ------------------------------------------------------------------ 배송 작업
function PackTab() {
  const { data, error, reload } = useLoad(async () => {
    const [requests, shops, devices] = await Promise.all([ops.requests(), ops.shops(), ops.devices()]);
    return { requests, shops, devices };
  });
  const { notice, setNotice, run } = useOps(reload);
  const [currentId, setCurrentId] = useState("");
  const [picked, setPicked] = useState([]);
  const [msg, setMsg] = useState(null);

  const queue = useMemo(() => (data?.requests || []).filter((r) => r.status === "ORDERED" || r.status === "RETURNED_TO_SENDER"), [data]);
  const shopName = Object.fromEntries((data?.shops || []).map((s) => [s.id, s.name]));
  const stock = new Set((data?.devices || []).filter((d) => d.status === "IN_STOCK").map((d) => d.serial));
  const assigned = new Set((data?.devices || []).filter((d) => d.status === "ASSIGNED").map((d) => d.requestId));
  const current = queue.find((r) => r.id === currentId) || queue[0];
  useEffect(() => setPicked([]), [current?.id]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress />;
  if (!current) return <Alert severity="info">배송 작업을 기다리는 신청이 없습니다. 입고가 끝나면 여기에 나타납니다.</Alert>;

  const shipOnly = current.status === "RETURNED_TO_SENDER" || assigned.has(current.id);
  const needA = current.androidQty - picked.filter((s) => modelOfSerial(s) === "ANDROID").length;
  const needI = current.iosQty - picked.filter((s) => modelOfSerial(s) === "IOS").length;
  const full = needA <= 0 && needI <= 0;

  function addSerial(code) {
    const s = code.toUpperCase();
    const model = modelOfSerial(s);
    if (!model) {
      setMsg({ severity: "error", text: `시리얼이 아닙니다: ${s}` });
      return false;
    }
    if (!stock.has(s)) {
      setMsg({ severity: "error", text: `재고에 없는 시리얼입니다(입고 전이거나 이미 배정됨): ${s}` });
      return false;
    }
    if (picked.includes(s)) {
      setMsg({ severity: "warning", text: "이미 담은 기기입니다." });
      return false;
    }
    if ((model === "ANDROID" ? needA : needI) <= 0) {
      setMsg({ severity: "error", text: `이 신청은 ${MODEL[model]}이 더 필요하지 않습니다. 기종을 확인하세요.` });
      return false;
    }
    setPicked((p) => [...p, s]);
    setMsg({ severity: "success", text: `${MODEL[model]} ${s} 담음` });
    return true;
  }

  async function ship(code) {
    const trackingNo = code.replace(/[^0-9]/g, "");
    if (trackingNo.length < 9) {
      setMsg({ severity: "error", text: "송장 번호로 보이지 않습니다(숫자 9자리 이상)." });
      return false;
    }
    const ok = await run(async () => {
      if (!shipOnly) await ops.act(`/printer/requests/${current.id}/assign`, { serials: picked });
      await ops.act(`/printer/requests/${current.id}/ship`, { trackingNo, date: today() });
    }, `${shopName[current.shopId]} ${current.applicantName} 발송 처리했습니다.`);
    if (ok) {
      setPicked([]);
      setMsg(null);
      setCurrentId("");
    }
    return ok;
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        예전에는 배송 리스트를 출력해 시리얼을 손으로 적었습니다. 이제 신청 한 건씩 기기 바코드를 찍어 담고, 송장 바코드를 찍으면 시리얼 배정과 발송이 한 번에 기록됩니다.
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ px: 2, pt: 1.5 }}>
            배송 대기 {queue.length}건
          </Typography>
          <Box sx={{ maxHeight: 360, overflow: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>영업장 · 신청자</TableCell>
                  <TableCell align="right">안드로이드</TableCell>
                  <TableCell align="right">iOS</TableCell>
                  <TableCell>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queue.map((r) => (
                  <TableRow key={r.id} hover selected={r.id === current.id} onClick={() => setCurrentId(r.id)} sx={{ cursor: "pointer" }}>
                    <TableCell>
                      {shopName[r.shopId]} {r.applicantName}
                    </TableCell>
                    <TableCell align="right">{r.androidQty}</TableCell>
                    <TableCell align="right">{r.iosQty}</TableCell>
                    <TableCell>
                      <StatusChip map={REQUEST_STATUS} value={r.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
        <Paper variant="outlined" sx={{ flex: 1.2, minWidth: 0, p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {shopName[current.shopId]} {current.applicantName}
          </Typography>
          {shipOnly ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {current.status === "RETURNED_TO_SENDER" ? "반송된 건입니다." : "시리얼이 이미 배정된 건입니다."} 송장만 찍으면 발송됩니다.
            </Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                1) 기기 바코드 찍기 — 남은 안드로이드 {Math.max(0, needA)} · iOS {Math.max(0, needI)}
              </Typography>
              {!full && <BarcodeInput key={`s-${current.id}`} label="기기 시리얼" onCode={addSerial} />}
              <Box sx={{ my: 1 }}>
                {picked.map((s) => (
                  <Chip key={s} label={s} size="small" onDelete={() => setPicked((p) => p.filter((x) => x !== s))} sx={{ m: 0.25, fontFamily: "monospace" }} />
                ))}
              </Box>
            </>
          )}
          {(full || shipOnly) && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                2) 택배 송장 바코드 찍기
              </Typography>
              <BarcodeInput key={`t-${current.id}`} label="송장 번호" onCode={ship} />
            </>
          )}
          {msg && (
            <Alert severity={msg.severity} sx={{ mt: 1 }}>
              {msg.text}
            </Alert>
          )}
        </Paper>
      </Stack>
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </Stack>
  );
}

const MODES = [
  ["pack", "배송 작업"],
  ["receive", "입고"],
  ["lookup", "시리얼 조회"],
];

export default function ScanPage() {
  const [params, setParams] = useSearchParams();
  const mode = MODES.some(([k]) => k === params.get("mode")) ? params.get("mode") : "pack";
  return (
    <Stack spacing={2}>
      <Tabs value={mode} onChange={(_, v) => setParams({ mode: v })}>
        {MODES.map(([k, l]) => (
          <Tab key={k} value={k} label={l} />
        ))}
      </Tabs>
      <Typography variant="caption" color="text.secondary">
        휴대폰에서는 "카메라" 버튼으로 바코드를 찍고, PC에서는 USB·블루투스 바코드 스캐너를 입력칸에 대고 쏘면 됩니다. 직접 입력 후 Enter도 됩니다.
      </Typography>
      {mode === "pack" && <PackTab />}
      {mode === "receive" && <ReceiveTab />}
      {mode === "lookup" && <LookupTab />}
    </Stack>
  );
}
