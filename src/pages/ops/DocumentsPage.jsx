import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { ops } from "../../api.js";
import useLoad from "./useLoad.js";
import Notice from "./Notice.jsx";
import {
  DEFAULT_SETTINGS,
  approvalDoc,
  asReportDoc,
  download,
  invoiceListDoc,
  monthlyOrdersDoc,
  profitReportDoc,
  purchaseOrderDoc,
  receivablesDoc,
  refundApprovalDoc,
  serialListDoc,
  shipmentStatusDoc,
  shippingListDoc,
  waybillDoc,
} from "./excelDocs.js";

const KEY = "ops-doc-settings";
const loadSettings = () => {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

function DocCard({ title, when, desc, onClick, disabled }) {
  return (
    <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {when}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {desc}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" startIcon={<DownloadIcon />} onClick={onClick} disabled={disabled}>
          엑셀 받기
        </Button>
      </CardActions>
    </Card>
  );
}

/** 매달 손으로 만들던 업무 문서를 시스템 데이터로 바로 엑셀로 내려받습니다. */
export default function DocumentsPage() {
  const { data, error } = useLoad(async () => {
    const [cycles, shops, requests, orders, devices, invoices, cases] = await Promise.all([
      ops.cycles(),
      ops.shops(),
      ops.requests(),
      ops.purchaseOrders(),
      ops.devices(),
      ops.invoices(),
      ops.cases(),
    ]);
    return { cycles, shops, requests, orders, devices, invoices, cases };
  });
  const [cycleId, setCycleId] = useState("");
  const [poId, setPoId] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [settings, setSettings] = useState(loadSettings);
  const [notice, setNotice] = useState(null);

  const cycles = useMemo(() => [...(data?.cycles || [])].sort((a, b) => b.month.localeCompare(a.month)), [data]);
  const orders = useMemo(() => [...(data?.orders || [])].sort((a, b) => b.orderedOn.localeCompare(a.orderedOn)), [data]);
  useEffect(() => {
    if (cycles.length && !cycleId) setCycleId((cycles.find((c) => c.confirmedOn) || cycles[0]).id);
    if (orders.length && !poId) setPoId(orders[0].id);
  }, [cycles, orders, cycleId, poId]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress />;

  const cycle = cycles.find((c) => c.id === cycleId);
  const po = orders.find((o) => o.id === poId);
  const shopName = Object.fromEntries(data.shops.map((s) => [s.id, s.name]));
  const years = [...new Set([...cycles.map((c) => c.month.slice(0, 4)), String(new Date().getFullYear())])].sort().reverse();

  const save = (next) => {
    setSettings(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* 저장 안 돼도 이번 화면에서는 사용 */
    }
  };

  const get = async (pair) => {
    try {
      const [build, name] = pair;
      await download(build, name);
      setNotice({ severity: "success", text: `${name} 파일을 만들었습니다.` });
    } catch (err) {
      setNotice({ severity: "error", text: `엑셀을 만들지 못했습니다: ${err.message}` });
    }
  };

  const groups = [
    {
      title: "발주 (매달 8일)",
      pick: "po",
      docs: [
        ["발주서", "제조사 메일 첨부", "발주 No., 품목(안드로이드·아이폰), 단가 130,000/160,000, 수량, 금액, 박스 구성까지 채워집니다.", () => purchaseOrderDoc(po, settings), !po],
        ["품의서", "그룹웨어 상신", "N차 납품 개요, Order Number, 수량·판매/매입 금액·예상 수익, 배송 방법(500대 이상 직배송), 일정. 발주서 시트 포함.", () => approvalDoc(po, data.cycles.find((c) => c.id === po.cycleId), data.requests, data.orders, settings), !po],
        ["시리얼 출고 리스트", "고객사 본사 제출", "발주별 안드로이드·iOS 시트에 시리얼, 배송 영업장, 배송일을 정리합니다(바코드로 찍은 그대로).", () => serialListDoc(po, data.devices, data.requests, data.shops), !po],
      ],
    },
    {
      title: "배송 (20일~말일)",
      pick: "cycle",
      docs: [
        ["배송리스트", "고객지원팀 공유", "영업팀·영업장·신청자·기종·입금액·주소·연락처. 고객지원팀 콜 대응용.", () => shippingListDoc(cycle, data.requests, data.shops), !cycle],
        ["송장요청서", "택배 송장 출력 요청", "영업장별 배송 총 수량과 3·5·8개입 박스 구성을 자동 계산합니다.", () => waybillDoc(cycle, data.requests, data.shops), !cycle],
      ],
    },
    {
      title: "계산서·수금 (다음 달 10일 전후)",
      pick: "cycle",
      docs: [
        ["세금계산서 발행리스트", "경영지원팀·고객사 공유", "본사 앞(직영·iOS 차액·리리코스) 시트와 개인(카운슬러) 앞 시트. 공급가액·VAT·합계 수식 포함.", () => invoiceListDoc(cycle, data.requests, data.shops, data.invoices), !cycle],
        ["환불 품의서", "그룹웨어 상신", "선택한 월의 취소·반품·기종 변경으로 생긴 환불 대상과 금액(VAT 포함).", () => refundApprovalDoc(cycle?.month, data.requests, data.cycles, shopName, settings), !cycle],
        ["미수금 보고서", "영업 대표 보고", "본사 앞 미수(경과일·기한 초과), 입금 대기 신청, 환불할 돈을 한 장에.", () => receivablesDoc(data.invoices, data.requests, data.shops, data.cycles), false],
      ],
    },
    {
      title: "보고 (월말)",
      pick: "year",
      docs: [
        ["출고현황", "회계팀 보고", "월별 발주·배송·반품을 안드로이드·아이폰으로 나눠 집계합니다.", () => shipmentStatusDoc(year, data.orders, data.requests, data.cases, data.devices), false],
        ["거래처별 월별 주문수량", "고객사 본사 제출", "영업장마다 월별 대수와 기종별 합계. 폐쇄 영업장도 상태와 함께 남습니다.", () => monthlyOrdersDoc(year, data.requests, data.shops, data.cycles), false],
        ["수익보고", "임원 보고", "발주 차수별 수량·매출·매입·수익과 계산서 발행·입금 여부.", () => profitReportDoc(data.orders, data.requests, data.invoices, settings), !data.orders.length],
        ["AS 요청현황", "제조사 서비스센터 공유", "월별 요청·완료·수리불가·미처리 요약과 접수 목록.", () => asReportDoc(year, data.cases, data.shops), false],
      ],
    },
  ];

  const picker = (kind) =>
    kind === "po" ? (
      <TextField select size="small" label="발주" value={po?.id || ""} onChange={(e) => setPoId(e.target.value)} sx={{ minWidth: 220 }}>
        {orders.map((o) => (
          <MenuItem key={o.id} value={o.id}>
            {o.orderNo} ({o.androidQty + o.iosQty}대)
          </MenuItem>
        ))}
      </TextField>
    ) : kind === "cycle" ? (
      <TextField select size="small" label="신청 월" value={cycle?.id || ""} onChange={(e) => setCycleId(e.target.value)} sx={{ minWidth: 160 }}>
        {cycles.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.month}
          </MenuItem>
        ))}
      </TextField>
    ) : (
      <TextField select size="small" label="연도" value={year} onChange={(e) => setYear(e.target.value)} sx={{ minWidth: 120 }}>
        {years.map((y) => (
          <MenuItem key={y} value={y}>
            {y}년
          </MenuItem>
        ))}
      </TextField>
    );

  return (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        2016~2017년에 매달 손으로 만들던 문서들입니다. 이제 시스템에 쌓인 데이터로 바로 엑셀이 나옵니다. 금액은 공급가액(VAT 별도) 기준이고, 합계 칸은 엑셀 수식이라 고치면 다시 계산됩니다.
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          문서에 들어갈 기본 정보 (이 브라우저에 저장)
        </Typography>
        <Grid container spacing={1.5}>
          {[
            ["company", "회사명"],
            ["department", "부서"],
            ["author", "담당자"],
            ["phone", "연락처"],
            ["supplier", "제조사(발주처)"],
            ["customer", "고객사"],
          ].map(([k, l]) => (
            <Grid key={k} size={{ xs: 6, md: 2 }}>
              <TextField size="small" label={l} value={settings[k]} onChange={(e) => save({ ...settings, [k]: e.target.value })} fullWidth />
            </Grid>
          ))}
        </Grid>
      </Paper>
      {groups.map((g) => (
        <Box key={g.title}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1.5, flexWrap: "wrap" }} useFlexGap>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
              {g.title}
            </Typography>
            {picker(g.pick)}
          </Stack>
          <Grid container spacing={2}>
            {g.docs.map(([t, when, desc, make, disabled]) => (
              <Grid key={t} size={{ xs: 12, sm: 6, md: 4 }}>
                <DocCard title={t} when={when} desc={desc} disabled={disabled} onClick={() => get(make())} />
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </Stack>
  );
}
