import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
  Alert,
  Box,
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
import { INVOICE_STATUS, INVOICE_TYPE, REQUEST_STATUS, today, thisMonth, won } from "./labels.js";
import ActionDialog from "./ActionDialog.jsx";
import StatusChip from "./StatusChip.jsx";
import Notice from "./Notice.jsx";
import useLoad from "./useLoad.js";
import useOps from "./useOps.js";

const CYCLE_STATUS = { OPEN: ["신청 받는 중", "primary"], CLOSED: ["마감", "default"] };

const dateField = (label = "처리일") => ({ name: "date", label, type: "date", default: today() });
const serialList = (text) =>
  (text || "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

function Section({ title, action, children }) {
  return (
    <Paper variant="outlined">
      <Stack direction="row" sx={{ px: 2, pt: 2, pb: 1, alignItems: "center", justifyContent: "space-between" }} spacing={1}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
          {action}
        </Stack>
      </Stack>
      {children}
    </Paper>
  );
}

function Empty({ cols, text }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} align="center" sx={{ color: "text.secondary", py: 3 }}>
        {text}
      </TableCell>
    </TableRow>
  );
}

export default function OrdersPage() {
  const [params] = useSearchParams();
  const focus = params.get("focus");
  const [cycleId, setCycleId] = useState(params.get("cycle") || "");
  useEffect(() => {
    if (params.get("cycle")) setCycleId(params.get("cycle"));
  }, [params]);
  const { data, error, reload } = useLoad(async () => {
    const [cycles, shops, requests, orders, invoices, devices] = await Promise.all([
      ops.cycles(),
      ops.shops(),
      ops.requests(),
      ops.purchaseOrders(),
      ops.invoices(),
      ops.devices(),
    ]);
    return { cycles, shops, requests, orders, invoices, devices };
  });
  const { notice, setNotice, run } = useOps(reload);
  const [dialog, setDialog] = useState(null);

  const cycles = useMemo(
    () => [...(data?.cycles || [])].sort((a, b) => b.month.localeCompare(a.month)),
    [data],
  );

  useEffect(() => {
    if (cycles.length && !cycles.some((c) => c.id === cycleId)) setCycleId(cycles[0].id);
  }, [cycles, cycleId]);

  // 할 일에서 넘어왔으면 그 줄로 스크롤
  useEffect(() => {
    if (focus && data) document.getElementById(`row-${focus}`)?.scrollIntoView?.({ block: "center", behavior: "smooth" });
  }, [focus, data, cycleId]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress />;

  const shopName = Object.fromEntries(data.shops.map((s) => [s.id, s.name]));
  const cycle = cycles.find((c) => c.id === cycleId);
  const requests = data.requests.filter((r) => r.cycleId === cycleId);
  const requestById = Object.fromEntries(data.requests.map((r) => [r.id, r]));
  const orders = data.orders.filter((o) => o.cycleId === cycleId);
  const invoices = data.invoices.filter((i) => i.cycleId === cycleId);
  const assigned = {};
  for (const d of data.devices) if (d.requestId) assigned[d.requestId] = (assigned[d.requestId] || 0) + 1;

  /** 창을 띄워 값을 받은 뒤 동작을 실행 */
  const ask = (config, perform, successText) =>
    setDialog({ ...config, onSubmit: (values) => run(() => perform(values), successText) });

  const openCycle = () =>
    ask(
      {
        title: "신청 기간 열기 (동작 1)",
        description: "한 달에 한 번, 다음 달 배송분 신청을 받기 시작합니다. 보통 1~7일에 신청과 입금을 받습니다.",
        fields: [
          { name: "month", label: "대상 월 (YYYY-MM)", default: thisMonth() },
          { name: "closesOn", label: "신청 마감일", type: "date", default: `${thisMonth()}-07` },
        ],
        submitLabel: "열기",
      },
      async (v) => {
        const c = await ops.act("/printer/cycles", v);
        setCycleId(c.id);
      },
      "신청 기간을 열었습니다.",
    );

  const cycleActions = cycle && [
    cycle.status === "OPEN" && (
      <Button
        key="req"
        size="small"
        variant="contained"
        onClick={() =>
          ask(
            {
              title: "신청 등록 (동작 2)",
              description: "특약점은 대당 143,000원을 개인이 먼저 입금합니다. iOS는 차액 30,000원을 본사에 청구합니다.",
              fields: [
                { name: "shopId", label: "영업장", type: "select", options: data.shops.map((s) => [s.id, `${s.code} ${s.name}`]) },
                { name: "applicantName", label: "신청자" },
                { name: "androidQty", label: "안드로이드 수량", type: "number", default: 1 },
                { name: "iosQty", label: "iOS 수량", type: "number", default: 0 },
              ],
              submitLabel: "등록",
            },
            (v) => ops.act("/printer/requests", { ...v, cycleId }),
            "신청을 등록했습니다.",
          )
        }
      >
        신청 등록
      </Button>
    ),
    cycle.status === "OPEN" && (
      <Button
        key="close"
        size="small"
        onClick={() =>
          ask(
            {
              title: "신청 마감 (동작 1)",
              description: "마감하면 입금 확인이 안 된 신청은 자동으로 '미입금 취소'가 됩니다.",
              fields: [dateField("마감일")],
              submitLabel: "마감",
            },
            (v) => ops.act(`/printer/cycles/${cycleId}/close`, v),
            "신청을 마감했습니다.",
          )
        }
      >
        신청 마감
      </Button>
    ),
    cycle.status === "CLOSED" && !cycle.confirmedOn && (
      <Button
        key="confirm"
        size="small"
        variant="contained"
        onClick={() =>
          ask(
            {
              title: "배송 리스트 확정 (동작 4)",
              description: "입금 확인된 신청을 이번 달 배송 대상으로 확정합니다.",
              fields: [dateField("확정일")],
              submitLabel: "확정",
            },
            (v) => ops.act(`/printer/cycles/${cycleId}/confirm`, v),
            "배송 리스트를 확정했습니다.",
          )
        }
      >
        배송 리스트 확정
      </Button>
    ),
    cycle.confirmedOn && orders.length === 0 && (
      <Button
        key="po"
        size="small"
        variant="contained"
        onClick={() =>
          ask(
            {
              title: "발주서 작성 (동작 5)",
              description: "확정 수량에 예비 수량을 더해 제조사에 발주합니다. 발주 번호를 비우면 날짜로 만들어집니다.",
              fields: [
                { name: "orderNo", label: "발주 번호(선택)" },
                { name: "orderedOn", label: "발주일", type: "date", default: today() },
                { name: "bufferAndroid", label: "예비 안드로이드", type: "number", default: 0 },
                { name: "bufferIos", label: "예비 iOS", type: "number", default: 0 },
                { name: "boxNote", label: "포장 메모(선택)", helper: "예: 39A 3개, 27A 2개" },
              ],
              submitLabel: "발주",
            },
            (v) => ops.act(`/printer/cycles/${cycleId}/purchase-orders`, v),
            "발주서를 만들었습니다.",
          )
        }
      >
        발주서 작성
      </Button>
    ),
    cycle.confirmedOn &&
      ["PERSONAL", "HQ"].map((type) => (
        <Button
          key={`inv-${type}`}
          size="small"
          onClick={() =>
            ask(
              {
                title: `${INVOICE_TYPE[type]} 계산서 요청 (동작 11)`,
                description:
                  type === "PERSONAL"
                    ? "배송 완료된 특약점 신청마다 개인 앞 계산서를 만듭니다. 보통 다음 달 10일에 발행합니다."
                    : "iOS 차액과 직영 영업소 대금을 합쳐 본사 앞 계산서 한 장을 만듭니다.",
                fields: [{ name: "plannedOn", label: "발행 예정일", type: "date", default: today() }],
                submitLabel: "요청",
              },
              (v) => ops.act(`/printer/cycles/${cycleId}/invoices`, { ...v, type }),
              "계산서 발행을 요청했습니다.",
            )
          }
        >
          {INVOICE_TYPE[type]} 계산서 요청
        </Button>
      )),
  ];

  function requestButtons(r) {
    const b = [];
    const btn = (label, onClick, variant = "text") => (
      <Button key={label} size="small" variant={variant} onClick={onClick}>
        {label}
      </Button>
    );
    const path = `/printer/requests/${r.id}`;
    const who = `${shopName[r.shopId] || ""} ${r.applicantName}`;

    if (r.status === "APPLIED")
      b.push(
        btn(
          r.personalAmount > 0 ? "입금 확인" : "접수 확인",
          () =>
            ask(
              {
                title: `${r.personalAmount > 0 ? "입금 확인" : "접수 확인"} (동작 3)`,
                description:
                  r.personalAmount > 0
                    ? `${who} · 받아야 할 금액 ${won(r.personalAmount)}. 금액이 다르면 처리되지 않습니다.`
                    : `${who} · 직영 영업소는 개인 입금 없이 본사로 청구합니다. 확인하지 않으면 마감 때 취소됩니다.`,
                fields: [{ name: "amount", label: "입금액", type: "number", default: r.personalAmount }, dateField("입금일")],
                submitLabel: "확인",
              },
              (v) => ops.act(`${path}/payment`, v),
              "입금을 확인했습니다.",
            ),
          "contained",
        ),
      );
    if (r.status === "ORDERED" && !assigned[r.id])
      b.push(
        btn(
          "시리얼 배정",
          () =>
            ask(
              {
                title: "시리얼 배정 (동작 8)",
                description: `${who} · 안드로이드 ${r.androidQty}대, iOS ${r.iosQty}대. 비워 두면 재고에서 자동으로 고릅니다.`,
                fields: [{ name: "serials", label: "시리얼(쉼표·줄바꿈 구분, 선택)" }],
                submitLabel: "배정",
              },
              (v) => ops.act(`${path}/assign`, { serials: serialList(v.serials) }),
              "시리얼을 배정했습니다.",
            ),
          "contained",
        ),
      );
    if ((r.status === "ORDERED" && assigned[r.id]) || r.status === "RETURNED_TO_SENDER")
      b.push(
        btn(
          r.status === "RETURNED_TO_SENDER" ? "재발송" : "발송",
          () =>
            ask(
              {
                title: `${r.status === "RETURNED_TO_SENDER" ? "재발송" : "발송"} (동작 9)`,
                description: `${who} · 택배 송장 번호를 입력합니다.`,
                fields: [{ name: "trackingNo", label: "송장 번호" }, dateField("발송일")],
                submitLabel: "발송",
              },
              (v) => ops.act(`${path}/ship`, v),
              "발송 처리했습니다.",
            ),
          "contained",
        ),
      );
    if (r.status === "SHIPPING") {
      b.push(
        btn(
          "배송 완료",
          () =>
            ask(
              { title: "배송 완료 (동작 10)", description: who, fields: [dateField("수령일")], submitLabel: "완료" },
              (v) => ops.act(`${path}/deliver`, v),
              "배송 완료로 바꿨습니다.",
            ),
          "contained",
        ),
      );
      b.push(
        btn("반송", () =>
          ask(
            {
              title: "반송 (동작 16)",
              description: `${who} · 주소 오류 등으로 돌아온 경우입니다. 확인 후 재발송합니다.`,
              fields: [
                { name: "reason", label: "반송 사유", default: "주소 오기" },
                { name: "correctedAddress", label: "고친 주소(선택)" },
                dateField("반송일"),
              ],
              submitLabel: "반송 처리",
            },
            (v) => ops.act(`${path}/return-to-sender`, v),
            "반송 처리했습니다.",
          ),
        ),
      );
    }
    if (["APPLIED", "PAID", "CONFIRMED"].includes(r.status) || (r.status === "ORDERED" && !assigned[r.id]))
      b.push(
        btn("기종 변경", () =>
          ask(
            {
              title: "기종 변경 (동작 15)",
              description: `${who} · 시리얼 배정 전까지만 바꿀 수 있습니다. 금액 차이는 환불 대기 또는 추가 입금으로 남습니다.`,
              fields: [
                { name: "androidQty", label: "안드로이드 수량", type: "number", default: r.androidQty },
                { name: "iosQty", label: "iOS 수량", type: "number", default: r.iosQty },
              ],
              submitLabel: "변경",
            },
            (v) => ops.act(`${path}/change-model`, v),
            "기종을 바꿨습니다.",
          ),
        ),
      );
    if (["APPLIED", "PAID", "CONFIRMED", "ORDERED"].includes(r.status))
      b.push(
        btn("취소", () =>
          ask(
            {
              title: "신청 취소 (동작 14)",
              description: `${who} · 입금된 신청이면 '환불 대기'가 되고, 배정된 기기는 재고로 돌아갑니다.`,
              fields: [{ name: "reason", label: "취소 사유" }, dateField("취소일")],
              submitLabel: "취소 처리",
            },
            (v) => ops.act(`${path}/cancel`, v),
            "취소했습니다.",
          ),
        ),
      );
    const owed = (r.refundDue || 0) - (r.refundedTotal || 0);
    if (owed > 0)
      b.push(
        btn(
          `환불 ${won(owed)}`,
          () =>
            ask(
              {
                title: "환불 (동작 18)",
                description: `${who} · 계산서가 이미 나간 건이면 정산 조정이 함께 기록됩니다.`,
                fields: [{ name: "amount", label: "환불액", type: "number", default: owed }, dateField("환불일")],
                submitLabel: "환불",
              },
              (v) => ops.act(`${path}/refund`, v),
              "환불을 기록했습니다.",
            ),
          "outlined",
        ),
      );
    return b;
  }

  function orderButtons(o) {
    const b = [];
    if (!o.approvalNo)
      b.push(
        <Button
          key="approve"
          size="small"
          onClick={() =>
            ask(
              {
                title: "품의 기록 (동작 6)",
                description: `${o.orderNo} 발주에 대한 사내 품의 번호를 남깁니다.`,
                fields: [{ name: "approvalNo", label: "품의 번호" }, dateField("승인일")],
                submitLabel: "기록",
              },
              (v) => ops.act(`/printer/purchase-orders/${o.id}/approval`, v),
              "품의를 기록했습니다.",
            )
          }
        >
          품의 기록
        </Button>,
      );
    const leftA = o.androidQty - o.receivedAndroid;
    const leftI = o.iosQty - o.receivedIos;
    if (leftA + leftI > 0)
      b.push(
        <Button
          key="receive"
          size="small"
          variant="contained"
          onClick={() =>
            ask(
              {
                title: "입고 (동작 7)",
                description: "받은 시리얼을 붙여 넣거나, 체험용으로 대수만 넣으면 시리얼을 자동으로 만듭니다.",
                fields: [
                  dateField("입고일"),
                  { name: "serials", label: "시리얼(쉼표·줄바꿈 구분, 선택)" },
                  { name: "autoAndroid", label: "자동 생성 안드로이드", type: "number", default: leftA },
                  { name: "autoIos", label: "자동 생성 iOS", type: "number", default: leftI },
                ],
                submitLabel: "입고",
              },
              (v) => ops.act(`/printer/purchase-orders/${o.id}/receipts`, { ...v, serials: serialList(v.serials) }),
              "입고했습니다.",
            )
          }
        >
          입고
        </Button>,
      );
    return b;
  }

  function invoiceButtons(i) {
    if (i.status === "REQUESTED")
      return (
        <Button
          size="small"
          variant="contained"
          onClick={() =>
            ask(
              { title: "계산서 발행 (동작 12)", fields: [dateField("발행일")], submitLabel: "발행" },
              (v) => ops.act(`/printer/invoices/${i.id}/issue`, v),
              "계산서를 발행했습니다.",
            )
          }
        >
          발행
        </Button>
      );
    if (i.status === "ISSUED" && i.type === "HQ")
      return (
        <Button
          size="small"
          variant="contained"
          onClick={() =>
            ask(
              {
                title: "본사 수금 확인 (동작 13)",
                description: `${won(i.amount)} 입금을 확인합니다.`,
                fields: [dateField("수금일")],
                submitLabel: "확인",
              },
              (v) => ops.act(`/printer/invoices/${i.id}/payment`, v),
              "수금을 확인했습니다.",
            )
          }
        >
          수금 확인
        </Button>
      );
    return null;
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
        <TextField
          select
          size="small"
          label="신청 월"
          value={cycle ? cycleId : ""}
          onChange={(e) => setCycleId(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          {cycles.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.month}
            </MenuItem>
          ))}
        </TextField>
        {cycle && (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <StatusChip map={CYCLE_STATUS} value={cycle.status} />
            <Typography variant="body2" color="text.secondary">
              마감 {cycle.closesOn}
              {cycle.confirmedOn ? ` · 확정 ${cycle.confirmedOn}` : ""}
            </Typography>
          </Stack>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="outlined" onClick={openCycle}>
          신청 기간 열기
        </Button>
      </Stack>

      {!cycle ? (
        <Alert severity="info">신청 기간이 없습니다. "신청 기간 열기"로 시작하세요.</Alert>
      ) : (
        <>
          <Section title={`신청 ${requests.length}건`} action={cycleActions}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>영업장</TableCell>
                    <TableCell>신청자</TableCell>
                    <TableCell align="right">안드로이드</TableCell>
                    <TableCell align="right">iOS</TableCell>
                    <TableCell align="right">개인 입금</TableCell>
                    <TableCell align="right">본사 청구</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>송장</TableCell>
                    <TableCell>할 수 있는 동작</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.length === 0 && <Empty cols={9} text="아직 신청이 없습니다." />}
                  {requests.map((r) => (
                    <TableRow key={r.id} id={`row-${r.id}`} hover selected={focus === r.id} sx={FOCUS}>
                      <TableCell>{shopName[r.shopId]}</TableCell>
                      <TableCell>{r.applicantName}</TableCell>
                      <TableCell align="right">{r.androidQty}</TableCell>
                      <TableCell align="right">{r.iosQty}</TableCell>
                      <TableCell align="right">{won(r.personalAmount)}</TableCell>
                      <TableCell align="right">{won(r.hqAmount)}</TableCell>
                      <TableCell>
                        <StatusChip map={REQUEST_STATUS} value={r.status} />
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{r.trackingNo || ""}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                          {requestButtons(r)}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Section>

          <Section title="발주·입고">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>발주 번호</TableCell>
                    <TableCell>발주일</TableCell>
                    <TableCell align="right">안드로이드(예비)</TableCell>
                    <TableCell align="right">iOS(예비)</TableCell>
                    <TableCell>품의</TableCell>
                    <TableCell>입고</TableCell>
                    <TableCell>동작</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.length === 0 && <Empty cols={7} text="배송 리스트를 확정한 뒤 발주서를 만듭니다." />}
                  {orders.map((o) => (
                    <TableRow key={o.id} id={`row-${o.id}`} selected={focus === o.id} sx={FOCUS}>
                      <TableCell>{o.orderNo}</TableCell>
                      <TableCell>{o.orderedOn}</TableCell>
                      <TableCell align="right">
                        {o.androidQty} ({o.bufferAndroid})
                      </TableCell>
                      <TableCell align="right">
                        {o.iosQty} ({o.bufferIos})
                      </TableCell>
                      <TableCell>{o.approvalNo ? `${o.approvalNo} (${o.approvedOn})` : "—"}</TableCell>
                      <TableCell>
                        {o.receivedAndroid + o.receivedIos}/{o.androidQty + o.iosQty}대{o.receivedOn ? ` · ${o.receivedOn}` : ""}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {orderButtons(o)}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Section>

          <Section title="계산서">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>구분</TableCell>
                    <TableCell>대상</TableCell>
                    <TableCell align="right">금액</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>예정·발행·수금</TableCell>
                    <TableCell>동작</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.length === 0 && <Empty cols={6} text="배송이 끝나면 계산서를 요청합니다." />}
                  {invoices.map((i) => {
                    const r = requestById[i.requestId];
                    return (
                      <TableRow key={i.id} id={`row-${i.id}`} selected={focus === i.id} sx={FOCUS}>
                        <TableCell>{INVOICE_TYPE[i.type]}</TableCell>
                        <TableCell>{r ? `${shopName[r.shopId] || ""} ${r.applicantName}` : "본사"}</TableCell>
                        <TableCell align="right">{won(i.amount)}</TableCell>
                        <TableCell>
                          <StatusChip map={INVOICE_STATUS} value={i.status} />
                        </TableCell>
                        <TableCell>{[i.plannedOn, i.issuedOn, i.paidOn].map((d) => d || "—").join(" / ")}</TableCell>
                        <TableCell>{invoiceButtons(i)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Section>
        </>
      )}

      <ActionDialog open={Boolean(dialog)} {...(dialog || {})} onClose={() => setDialog(null)} />
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </Stack>
  );
}
