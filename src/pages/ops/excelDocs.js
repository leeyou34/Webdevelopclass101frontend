/**
 * 업무 문서 엑셀 만들기. 2016~2017년에 손으로 만들던 양식(발주서, 품의서, 배송리스트, 송장요청서,
 * 시리얼 출고 리스트, 세금계산서 발행리스트, 출고현황, 거래처별 월별 주문수량, 수익보고, 미수금 보고서, AS 요청현황)을
 * 시스템 데이터로 바로 만듭니다. 금액은 공급가액(VAT 별도) 기준이고, 합계·금액 칸은 엑셀 수식으로 넣습니다.
 */

export const DEFAULT_SETTINGS = {
  company: "우리 회사",
  department: "영업팀",
  author: "",
  phone: "",
  supplier: "빅솔론(BIXOLON)",
  customer: "고객사 방문판매팀",
};

const PRICE = { saleA: 143000, saleI: 173000, costA: 130000, costI: 160000 };
const PRODUCT = {
  ANDROID: "SPP-R210BKM/AMR (안드로이드용, 화이트)",
  IOS: "SPP-R210iM/AMR (아이폰용, 화이트)",
};
const NAVY = "FF1F3A5F";
const LIGHT = "FFEEF2F7";
const FONT = "맑은 고딕";

let excelPromise;
const loadExcel = () => (excelPromise ||= import("exceljs").then((m) => m.default || m));

// ----------------------------------------------------------------- 공통 도구

/** 3·5·8개입 박스로 빈칸이 가장 적고, 같으면 상자 수가 가장 적은 조합 */
export function boxPlan(qty) {
  if (qty <= 0) return { b8: 0, b5: 0, b3: 0, empty: 0 };
  let best = null;
  for (let b8 = 0; b8 <= Math.ceil(qty / 8); b8++) {
    for (let b5 = 0; b5 <= Math.ceil(qty / 5); b5++) {
      const rest = qty - b8 * 8 - b5 * 5;
      const b3 = rest > 0 ? Math.ceil(rest / 3) : 0;
      const cap = b8 * 8 + b5 * 5 + b3 * 3;
      if (cap < qty) continue;
      const cand = { b8, b5, b3, empty: cap - qty, count: b8 + b5 + b3 };
      if (!best || cand.empty < best.empty || (cand.empty === best.empty && cand.count < best.count)) best = cand;
    }
  }
  return best;
}

export const boxText = (p) =>
  [p.b8 && `8개입×${p.b8}`, p.b5 && `5개입×${p.b5}`, p.b3 && `3개입×${p.b3}`].filter(Boolean).join(", ") || "-";

const ymd = (d) => d || "";
const todayStr = () => new Date().toLocaleDateString("sv-SE");

function styleHeader(row) {
  row.eachCell((c) => {
    c.font = { name: FONT, bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = border();
  });
  row.height = 22;
}

function border() {
  const t = { style: "thin", color: { argb: "FFB7C0CC" } };
  return { top: t, left: t, bottom: t, right: t };
}

function styleBody(ws, fromRow, toRow, cols) {
  for (let r = fromRow; r <= toRow; r++) {
    for (let c = 1; c <= cols; c++) {
      const cell = ws.getCell(r, c);
      cell.font = { name: FONT, size: 10, ...(cell.font || {}) };
      cell.border = border();
      if (typeof cell.value === "number" || cell.value?.formula) cell.numFmt = cell.numFmt || "#,##0";
    }
  }
}

function title(ws, text, cols, sub) {
  ws.mergeCells(1, 1, 1, cols);
  const t = ws.getCell(1, 1);
  t.value = text;
  t.font = { name: FONT, bold: true, size: 16, color: { argb: NAVY } };
  t.alignment = { vertical: "middle" };
  ws.getRow(1).height = 30;
  if (sub) {
    ws.mergeCells(2, 1, 2, cols);
    const s = ws.getCell(2, 1);
    s.value = sub;
    s.font = { name: FONT, size: 9, color: { argb: "FF5A6472" } };
  }
}

function widths(ws, list) {
  list.forEach((w, i) => (ws.getColumn(i + 1).width = w));
}

const f = (formula, result) => ({ formula, result });
const col = (n) => String.fromCharCode(64 + n);

/** 표 하나를 쓰고 마지막 행 번호를 돌려줌. sumCols: 합계를 낼 열 번호 */
function table(ws, startRow, headers, rows, { sumCols = [], sumLabelCol = 1 } = {}) {
  styleHeader(ws.getRow(startRow));
  headers.forEach((h, i) => (ws.getCell(startRow, i + 1).value = h));
  styleHeader(ws.getRow(startRow));
  rows.forEach((r, i) => {
    r.forEach((v, j) => (ws.getCell(startRow + 1 + i, j + 1).value = v));
  });
  let end = startRow + rows.length;
  styleBody(ws, startRow + 1, end, headers.length);
  if (sumCols.length) {
    end += 1;
    ws.getCell(end, sumLabelCol).value = "합계";
    for (const c of sumCols) {
      const L = col(c);
      const total = rows.reduce((s, r) => s + (typeof r[c - 1] === "number" ? r[c - 1] : r[c - 1]?.result || 0), 0);
      ws.getCell(end, c).value = rows.length ? f(`SUM(${L}${startRow + 1}:${L}${end - 1})`, total) : 0;
    }
    styleBody(ws, end, end, headers.length);
    for (let c = 1; c <= headers.length; c++) {
      const cell = ws.getCell(end, c);
      cell.font = { name: FONT, bold: true, size: 10 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
    }
  }
  return end;
}

function note(ws, row, cols, text) {
  ws.mergeCells(row, 1, row, cols);
  const c = ws.getCell(row, 1);
  c.value = text;
  c.font = { name: FONT, size: 9, color: { argb: "FF5A6472" } };
  c.alignment = { wrapText: true, vertical: "top" };
}

export async function download(build, filename) {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  wb.creator = "모바일 프린터 운영관리";
  wb.created = new Date();
  build(wb);
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ----------------------------------------------------------------- 1. 발주서

function purchaseOrderSheet(wb, po, s) {
  const ws = wb.addWorksheet("발주서");
  widths(ws, [16, 40, 12, 10, 16, 18]);
  title(ws, "발   주   서", 6);
  const info = [
    ["발주 No.", po.orderNo, "", "발주부서", s.department],
    ["발 주 일", po.orderedOn, "", "담당자", s.author],
    ["거래업체", `${s.supplier} 貴中`, "", "전화", s.phone],
    ["발주처", s.company, "", "", ""],
  ];
  info.forEach((r, i) => {
    r.forEach((v, j) => {
      const c = ws.getCell(3 + i, j + 1);
      c.value = v;
      c.font = { name: FONT, size: 10, bold: j === 0 || j === 3 };
    });
  });
  const rows = [];
  if (po.androidQty) rows.push([PRODUCT.ANDROID, PRICE.costA, po.androidQty]);
  if (po.iosQty) rows.push([PRODUCT.IOS, PRICE.costI, po.iosQty]);
  const start = 8;
  const end = table(
    ws,
    start,
    ["No", "품목 및 규격 (Model 명)", "단가", "수량", "금액", "비고"],
    rows.map((r, i) => [i + 1, r[0], r[1], r[2], f(`C${start + 1 + i}*D${start + 1 + i}`, r[1] * r[2]), "VAT 별도"]),
    { sumCols: [4, 5], sumLabelCol: 2 },
  );
  const plan = boxPlan(po.androidQty + po.iosQty);
  note(
    ws,
    end + 2,
    6,
    `· 예비 수량 포함(안드로이드 ${po.bufferAndroid || 0}대, iOS ${po.bufferIos || 0}대). 납기: 발주일로부터 약 2주.\n` +
      `· 포장 박스: ${po.boxNote || boxText(plan)} (3·5·8개입). ${po.androidQty + po.iosQty >= 500 ? "500대 이상: 공장 직배송 요청." : "500대 미만: 당사 앞 택배 배송."}`,
  );
  ws.getRow(end + 2).height = 36;
  return ws;
}

export function purchaseOrderDoc(po, s) {
  return [(wb) => purchaseOrderSheet(wb, po, s), `발주서_${po.orderNo}.xlsx`];
}

// ----------------------------------------------------------------- 2. 품의서 (발주·배송)

export function approvalDoc(po, cycle, requests, allOrders, s) {
  const seq = [...allOrders].sort((a, b) => a.orderedOn.localeCompare(b.orderedOn)).findIndex((o) => o.id === po.id) + 1;
  const qty = po.androidQty + po.iosQty;
  const sale = po.androidQty * PRICE.saleA + po.iosQty * PRICE.saleI;
  const cost = po.androidQty * PRICE.costA + po.iosQty * PRICE.costI;
  const live = requests.filter((r) => r.cycleId === po.cycleId && !["CANCELLED", "CANCELLED_UNPAID", "REFUNDED", "REFUND_PENDING"].includes(r.status));
  const shops = new Set(live.map((r) => r.shopId)).size;
  return [
    (wb) => {
      const ws = wb.addWorksheet("품의서");
      widths(ws, [18, 36, 14, 12, 16, 16]);
      title(ws, "품   의   서", 6, "그룹웨어 상신용 본문. 발주서를 첨부합니다.");
      const head = [
        ["품의 번호", po.approvalNo || "(상신 후 기입)"],
        ["기안일", todayStr()],
        ["기안부서 / 기안자", `${s.department} / ${s.author || ""}`],
        ["제목", `${s.customer} 모바일 프린터기 ${seq}차 납품 진행의 건 (${cycle?.month || ""} 신청분)`],
      ];
      head.forEach((r, i) => {
        ws.getCell(4 + i, 1).value = r[0];
        ws.mergeCells(4 + i, 2, 4 + i, 6);
        ws.getCell(4 + i, 2).value = r[1];
        ws.getCell(4 + i, 1).font = { name: FONT, bold: true, size: 10 };
        ws.getCell(4 + i, 2).font = { name: FONT, size: 10 };
      });
      let r = 9;
      const para = (t, bold) => {
        ws.mergeCells(r, 1, r, 6);
        const c = ws.getCell(r, 1);
        c.value = t;
        c.font = { name: FONT, size: 10, bold };
        c.alignment = { wrapText: true };
        r++;
      };
      para("1. 개요", true);
      para(`- ${s.customer} 대상 모바일 프린터기 ${seq}차 납품을 진행하고자 합니다.`);
      para(`- Order Number : ${po.orderNo}`);
      para(`- 공급 수량 : ${qty} EA (안드로이드용 ${po.androidQty} EA + 아이폰용 ${po.iosQty} EA, 예비 수량 포함) · 배송 영업장 ${shops}곳`);
      r++;
      para("2. 내용 (VAT 별도)", true);
      const start = r;
      const rows = [];
      if (po.androidQty) rows.push(["안드로이드용", po.androidQty, PRICE.saleA, PRICE.costA]);
      if (po.iosQty) rows.push(["아이폰용", po.iosQty, PRICE.saleI, PRICE.costI]);
      const end = table(
        ws,
        start,
        ["구분", "수량", "판매 단가", "판매 금액", "매입 단가", "매입 금액"],
        rows.map((x, i) => [x[0], x[1], x[2], f(`B${start + 1 + i}*C${start + 1 + i}`, x[1] * x[2]), x[3], f(`B${start + 1 + i}*E${start + 1 + i}`, x[1] * x[3])]),
        { sumCols: [2, 4, 6] },
      );
      r = end + 1;
      ws.getCell(r, 5).value = "예상 수익";
      ws.getCell(r, 6).value = f(`D${end}-F${end}`, sale - cost);
      ws.getCell(r, 5).font = { name: FONT, bold: true, size: 10 };
      ws.getCell(r, 6).numFmt = "#,##0";
      r += 2;
      para("3. 배송 방법", true);
      para(qty >= 500 ? "- 500대 이상으로 제조사 공장에서 영업장 앞 직배송(당사 직원 출장 동행). 출장 일정·경비 포함." : "- 500대 미만으로 당사 입고 후 택배 배송(송장 요청).");
      r++;
      para("4. 일정", true);
      para(`- 발주 ${po.orderedOn} → 입고 예정 ${cycle ? `${cycle.month}-20` : "발주 후 약 2주"} 전후 → 영업장 배송 ${cycle ? `${cycle.month} 말일` : ""}까지`);
      para("- 개인 앞 계산서: 배송 완료 후 / 본사 앞 계산서: 다음 달 10일 전후");
      r++;
      para("5. 첨부", true);
      para(`- 발주서 (${po.orderNo}) — 이 파일의 "발주서" 시트`);
      purchaseOrderSheet(wb, po, s);
    },
    `품의서_${po.orderNo}.xlsx`,
  ];
}

// ----------------------------------------------------------------- 3. 환불 품의서

export function refundApprovalDoc(month, requests, cycles, shopName, s) {
  const monthOf = Object.fromEntries(cycles.map((c) => [c.id, c.month]));
  const list = requests.filter((r) => r.refundDue > 0 && (!month || monthOf[r.cycleId] === month));
  return [
    (wb) => {
      const ws = wb.addWorksheet("환불 품의서");
      widths(ws, [6, 20, 14, 10, 10, 16, 16, 30]);
      title(ws, "품   의   서 (납품 취소 및 환불)", 8, `기안일 ${todayStr()} · ${s.department} ${s.author}`);
      note(ws, 4, 8, `1. 개요: ${s.customer} 모바일 프린터기 신청 취소·반품·기종 변경에 따른 환불 진행 요청 (${month || "전체"} 기준)`);
      const start = 6;
      const end = table(
        ws,
        start,
        ["No", "영업장", "신청자", "안드로이드", "iOS", "환불액(VAT 포함)", "환불 완료", "사유"],
        list.map((r, i) => [i + 1, shopName[r.shopId] || "", r.applicantName, r.androidQty, r.iosQty, r.refundDue, r.refundedTotal, r.note || ""]),
        { sumCols: [6, 7], sumLabelCol: 2 },
      );
      note(ws, end + 2, 8, "2. 처리 계획: 환불 계좌 확인 후 이체, 반품 기기는 재고로 돌려 다음 신청분에 사용. 계산서가 이미 발행된 건은 해당 월 계산서에서 조정합니다.\n3. 첨부: 환불 계좌 사본(별도)");
      ws.getRow(end + 2).height = 40;
    },
    `환불품의서_${month || "전체"}.xlsx`,
  ];
}

// ----------------------------------------------------------------- 4. 배송리스트

export function shippingListDoc(cycle, requests, shops) {
  const shopBy = Object.fromEntries(shops.map((x) => [x.id, x]));
  const rows = requests
    .filter((r) => r.cycleId === cycle.id && !["CANCELLED", "CANCELLED_UNPAID", "REFUNDED"].includes(r.status))
    .sort((a, b) => (shopBy[a.shopId]?.team || "").localeCompare(shopBy[b.shopId]?.team || "") || (shopBy[a.shopId]?.name || "").localeCompare(shopBy[b.shopId]?.name || ""));
  return [
    (wb) => {
      const ws = wb.addWorksheet(`${cycle.month} 배송리스트`);
      widths(ws, [5, 10, 16, 12, 9, 9, 14, 12, 12, 36, 15]);
      const a = rows.reduce((n, r) => n + r.androidQty, 0);
      const i = rows.reduce((n, r) => n + r.iosQty, 0);
      title(ws, `${cycle.month} 모바일 프린터기 배송리스트`, 11, `총 ${a + i}대 (안드로이드 ${a} · 아이폰 ${i}) · 고객지원팀 공유용(콜 대응)`);
      table(
        ws,
        4,
        ["No", "영업팀", "영업장", "신청자", "안드로이드", "아이폰", "개인 입금(VAT 포함)", "입금일", "상태", "배송 주소", "연락처"],
        rows.map((r, n) => {
          const sh = shopBy[r.shopId] || {};
          return [n + 1, sh.team || "", sh.name || "", r.applicantName, r.androidQty, r.iosQty, r.paidAmount || 0, ymd(r.paidOn), statusKo(r.status), sh.address || "", sh.phone || ""];
        }),
        { sumCols: [5, 6, 7], sumLabelCol: 3 },
      );
    },
    `배송리스트_${cycle.month}.xlsx`,
  ];
}

// ----------------------------------------------------------------- 5. 송장요청서

export function waybillDoc(cycle, requests, shops) {
  const shopBy = Object.fromEntries(shops.map((x) => [x.id, x]));
  const per = new Map();
  for (const r of requests) {
    if (r.cycleId !== cycle.id || !["ORDERED", "SHIPPING", "DELIVERED", "INVOICED", "COMPLETED", "CONFIRMED", "PAID"].includes(r.status)) continue;
    per.set(r.shopId, (per.get(r.shopId) || 0) + r.androidQty + r.iosQty);
  }
  const rows = [...per.entries()].map(([id, n]) => [shopBy[id] || {}, n]).sort((a, b) => (a[0].name || "").localeCompare(b[0].name || ""));
  return [
    (wb) => {
      const ws = wb.addWorksheet("Total 송장요청서");
      widths(ws, [6, 16, 40, 15, 12, 20, 14]);
      title(ws, `${cycle.month} 송장요청서`, 7, "택배 송장 출력 요청용. 박스 구성은 3·5·8개입 기준 자동 계산");
      table(
        ws,
        4,
        ["번호", "영업장명", "주소", "영업장 번호", "배송 총 수량", "박스 구성", "물품"],
        rows.map(([sh, n], i) => [i + 1, sh.name || "", sh.address || "", sh.phone || "", n, boxText(boxPlan(n)), "모바일 프린터기"]),
        { sumCols: [5], sumLabelCol: 2 },
      );
    },
    `송장요청서_${cycle.month}.xlsx`,
  ];
}

// ----------------------------------------------------------------- 6. 시리얼 출고 리스트

export function serialListDoc(po, devices, requests, shops) {
  const shopName = Object.fromEntries(shops.map((x) => [x.id, x.name]));
  const reqName = Object.fromEntries(requests.map((r) => [r.id, r.applicantName]));
  const mine = devices.filter((d) => d.purchaseOrderId === po.id);
  return [
    (wb) => {
      for (const [model, label, prefix] of [["ANDROID", "안드로이드", ""], ["IOS", "iOS", "I_"]]) {
        const list = mine.filter((d) => d.model === model).sort((a, b) => a.serial.localeCompare(b.serial));
        const ws = wb.addWorksheet(`${po.orderNo} ${label} (${list.length})`);
        widths(ws, [6, 20, 20, 14, 14, 16]);
        title(ws, `${prefix}${po.orderNo} <총 수량 ${list.length}>`, 6, "고객사 본사 제출용 시리얼 넘버 목록");
        table(
          ws,
          4,
          ["Num", "Delivery Point", "Serial", "Delivery Date", "신청자", "상태"],
          list.map((d, i) => [i + 1, shopName[d.shopId] || "(재고)", d.serial, ymd(d.deliveredOn), reqName[d.requestId] || "", deviceKo(d.status)]),
        );
      }
    },
    `시리얼_출고리스트_${po.orderNo}.xlsx`,
  ];
}

// ----------------------------------------------------------------- 7. 세금계산서 발행리스트

export function invoiceListDoc(cycle, requests, shops, invoices) {
  const shopBy = Object.fromEntries(shops.map((x) => [x.id, x]));
  const live = requests.filter((r) => r.cycleId === cycle.id && r.deliveredOn && !["CANCELLED", "CANCELLED_UNPAID", "REFUNDED"].includes(r.status));
  const typeOf = (r) => shopBy[r.shopId]?.type || "SPECIALTY";
  const count = (t, m) => live.filter((r) => typeOf(r) === t).reduce((n, r) => n + (m === "A" ? r.androidQty : r.iosQty), 0);
  const invOf = Object.fromEntries(invoices.filter((x) => x.requestId).map((x) => [x.requestId, x]));
  return [
    (wb) => {
      const ws = wb.addWorksheet(`${cycle.month} 본사 계산서 발행`);
      widths(ws, [22, 14, 16, 12, 14, 16, 34]);
      title(ws, `${cycle.month} 발주분 본사 앞 계산서 발행분`, 7, "VAT 별도(공급가액)");
      const rows = [
        ["안드로이드 · 직영 영업소", "본사 → 영업소", "전체 지원", count("DIRECT", "A"), PRICE.saleA],
        ["아이폰 · 직영 영업소", "본사 → 영업소", "전체 지원", count("DIRECT", "I"), PRICE.saleI],
        ["아이폰 · 특약점 카운슬러", "본사 → 특약점", "부분 지원", count("SPECIALTY", "I"), PRICE.saleI - 143000],
        ["안드로이드 · 리리코스 지사", "본사 → 지사", "부분 지원", count("LIRICOS", "A"), 89000],
        ["아이폰 · 리리코스 지사", "본사 → 지사", "부분 지원", count("LIRICOS", "I"), 109000],
      ];
      const start = 4;
      table(
        ws,
        start,
        ["구분", "지원 분야", "지원 방식", "수량", "단가", "금액", "비고"],
        rows.map((x, i) => [x[0], x[1], x[2], x[3], x[4], f(`D${start + 1 + i}*E${start + 1 + i}`, x[3] * x[4]), x[3] ? `${cycle.month} 배송분` : ""]),
        { sumCols: [4, 6] },
      );

      const ws2 = wb.addWorksheet(`${cycle.month} 개인 계산서 발행`);
      widths(ws2, [5, 16, 12, 10, 8, 14, 12, 14, 12, 12, 12]);
      const personal = live.filter((r) => r.personalAmount > 0);
      title(ws2, `${cycle.month} 발주분 개인(카운슬러) 앞 계산서 발행분`, 11, `총 ${personal.reduce((n, r) => n + r.androidQty + r.iosQty, 0)}대 · 금액은 공급가액, 합계는 VAT 포함`);
      const s2 = 4;
      table(
        ws2,
        s2,
        ["No", "영업장", "신청자", "안드로이드", "아이폰", "공급가액", "VAT", "합계", "입금일", "배송 완료", "계산서"],
        personal.map((r, i) => {
          const n = s2 + 1 + i;
          return [i + 1, shopBy[r.shopId]?.name || "", r.applicantName, r.androidQty, r.iosQty, r.personalAmount, f(`ROUND(F${n}*0.1,0)`, Math.round(r.personalAmount * 0.1)), f(`F${n}+G${n}`, Math.round(r.personalAmount * 1.1)), ymd(r.paidOn), ymd(r.deliveredOn), invKo(invOf[r.id]?.status)];
        }),
        { sumCols: [4, 5, 6, 7, 8], sumLabelCol: 2 },
      );
    },
    `세금계산서_발행리스트_${cycle.month}.xlsx`,
  ];
}

// ----------------------------------------------------------------- 8. 출고현황 (월별)

export function shipmentStatusDoc(year, orders, requests, cases, devices) {
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  return [
    (wb) => {
      const ws = wb.addWorksheet(`${year} 출고현황`);
      widths(ws, [10, 10, 10, 10, 10, 10, 10, 10, 10]);
      title(ws, `${year}년 모바일 프린터기 출고현황`, 9, "발주 = 발주서 수량, 배송 = 영업장 배송 완료(회계상 발행 기준과 다를 수 있음), 반품 = 반품 접수, 재고 = 월말 재고(현재 기준 근사)");
      const rows = months.map((m) => {
        const po = orders.filter((o) => (o.orderedOn || "").startsWith(m));
        const del = requests.filter((r) => (r.deliveredOn || "").startsWith(m));
        const ret = cases.filter((k) => k.type === "RETURN" && (k.openedOn || "").startsWith(m));
        const retA = ret.filter((k) => devices.find((d) => d.serial === k.serial)?.model !== "IOS").length;
        return [
          m,
          po.reduce((n, o) => n + o.androidQty, 0),
          del.reduce((n, r) => n + r.androidQty, 0),
          retA,
          po.reduce((n, o) => n + o.iosQty, 0),
          del.reduce((n, r) => n + r.iosQty, 0),
          ret.length - retA,
        ];
      });
      const start = 4;
      ws.mergeCells(start - 1, 2, start - 1, 4);
      ws.getCell(start - 1, 2).value = "안드로이드";
      ws.mergeCells(start - 1, 5, start - 1, 7);
      ws.getCell(start - 1, 5).value = "아이폰";
      [2, 5].forEach((c) => (ws.getCell(start - 1, c).font = { name: FONT, bold: true }));
      table(ws, start, ["월", "발주", "배송", "반품", "발주", "배송", "반품"], rows, { sumCols: [2, 3, 4, 5, 6, 7] });
    },
    `출고현황_${year}.xlsx`,
  ];
}

// ----------------------------------------------------------------- 9. 거래처별 월별 주문수량

export function monthlyOrdersDoc(year, requests, shops, cycles) {
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const monthOf = Object.fromEntries(cycles.map((c) => [c.id, c.month]));
  const live = requests.filter((r) => !["CANCELLED", "CANCELLED_UNPAID", "REFUNDED", "REFUND_PENDING"].includes(r.status));
  return [
    (wb) => {
      const ws = wb.addWorksheet(`${year} 월별 주문수량`);
      const fixed = ["No", "사업부", "영업팀", "코드", "거래처", "상태", "경로", "안드로이드 합", "iOS 합"];
      widths(ws, [5, 10, 12, 10, 16, 8, 12, 11, 9, ...months.map(() => 8)]);
      title(ws, `◆ 모바일 프린터기 거래처별 월별 주문수량 (${year})`, fixed.length + months.length, "고객사 본사 제출용 · 월 = 신청 월 · 칸 = 안드로이드+iOS 대수");
      const start = 4;
      const rows = shops.map((sh, i) => {
        const mine = live.filter((r) => r.shopId === sh.id && (monthOf[r.cycleId] || "").startsWith(String(year)));
        return [
          i + 1,
          sh.division || "",
          sh.team || "",
          sh.code,
          sh.name,
          sh.active ? "정상" : `폐쇄 ${sh.closedOn || ""}`,
          { SPECIALTY: "특약점", DIRECT: "영업소", LIRICOS: "리리코스 지사" }[sh.type] || "",
          mine.reduce((sum, r) => sum + r.androidQty, 0),
          mine.reduce((sum, r) => sum + r.iosQty, 0),
          ...months.map((m) => mine.filter((r) => monthOf[r.cycleId] === m).reduce((sum, r) => sum + r.androidQty + r.iosQty, 0)),
        ];
      });
      table(ws, start, [...fixed, ...months.map((m) => m.replace("-", ""))], rows, {
        sumCols: [8, 9, ...months.map((_, i) => fixed.length + 1 + i)],
        sumLabelCol: 5,
      });
      ws.views = [{ state: "frozen", xSplit: 5, ySplit: start }];
    },
    `거래처별_월별_주문수량_${year}.xlsx`,
  ];
}

// ----------------------------------------------------------------- 10. 수익보고

export function profitReportDoc(orders, requests, invoices, s) {
  const sorted = [...orders].sort((a, b) => a.orderedOn.localeCompare(b.orderedOn));
  return [
    (wb) => {
      const ws = wb.addWorksheet("수익현황");
      widths(ws, [8, 16, 10, 10, 14, 14, 14, 14, 14, 10]);
      title(ws, `${s.customer} 모바일 프린터기 수익현황`, 10, `작성 ${todayStr()} · VAT 별도 · 대당 수익 안드로이드 13,000 / iOS 13,000`);
      const start = 4;
      const end = table(
        ws,
        start,
        ["차수", "발주번호", "안드로이드", "iOS", "매출", "매입", "수익", "본사 발행일", "영업장 발행", "입금 완료"],
        sorted.map((o, i) => {
          const n = start + 1 + i;
          const reqs = requests.filter((r) => r.cycleId === o.cycleId && r.deliveredOn);
          const hq = invoices.find((x) => x.type === "HQ" && x.cycleId === o.cycleId);
          const pInv = invoices.filter((x) => x.type === "PERSONAL" && x.cycleId === o.cycleId);
          const allIssued = pInv.length > 0 && pInv.every((x) => x.status !== "REQUESTED");
          return [
            `${i + 1}차`,
            o.orderNo,
            o.androidQty,
            o.iosQty,
            f(`C${n}*${PRICE.saleA}+D${n}*${PRICE.saleI}`, o.androidQty * PRICE.saleA + o.iosQty * PRICE.saleI),
            f(`C${n}*${PRICE.costA}+D${n}*${PRICE.costI}`, o.androidQty * PRICE.costA + o.iosQty * PRICE.costI),
            f(`E${n}-F${n}`, o.androidQty * (PRICE.saleA - PRICE.costA) + o.iosQty * (PRICE.saleI - PRICE.costI)),
            hq?.issuedOn || "",
            reqs.length === 0 ? "" : allIssued ? "전체 발행완료" : "발행 중",
            hq ? (hq.status === "PAID" ? "O" : "X") : "-",
          ];
        }),
        { sumCols: [3, 4, 5, 6, 7], sumLabelCol: 2 },
      );
      note(ws, end + 2, 10, "· 매출은 발주 수량(예비 포함) 기준입니다. 실제 배송·반품 반영 수치는 대시보드의 기간별 현황을 참고하세요.");
    },
    `수익보고_${todayStr()}.xlsx`,
  ];
}

// ----------------------------------------------------------------- 11. 미수금 보고서

export function receivablesDoc(invoices, requests, shops, cycles, overdueDays = 30) {
  const shopName = Object.fromEntries(shops.map((x) => [x.id, x.name]));
  const monthOf = Object.fromEntries(cycles.map((c) => [c.id, c.month]));
  const today = todayStr();
  const days = (d) => Math.round((new Date(today) - new Date(d)) / 86400000);
  const hq = invoices.filter((x) => x.type === "HQ" && x.status === "ISSUED");
  const waiting = requests.filter((r) => r.status === "APPLIED" && r.personalAmount > 0);
  const refunds = requests.filter((r) => r.refundDue > r.refundedTotal);
  return [
    (wb) => {
      const ws = wb.addWorksheet("미수금 보고서");
      widths(ws, [6, 22, 14, 14, 12, 12, 30]);
      title(ws, "모바일 프린터기 미수금 현황", 7, `${today} 기준 · 기한 = 계산서 발행 후 ${overdueDays}일`);
      const section = (row, text) => {
        ws.getCell(row, 1).value = text;
        ws.getCell(row, 1).font = { name: FONT, bold: true, size: 11, color: { argb: NAVY } };
      };
      section(3, "1. 본사 앞 미수금");
      let end = table(
        ws,
        4,
        ["No", "구분", "발행일", "금액(VAT 별도)", "경과일", "기한 초과", "대상 월"],
        hq.map((x, i) => [i + 1, "본사 앞 계산서", x.issuedOn, x.amount, days(x.issuedOn), days(x.issuedOn) > overdueDays ? "초과" : "", monthOf[x.cycleId] || ""]),
        { sumCols: [4], sumLabelCol: 2 },
      );
      section(end + 2, "2. 입금 대기 신청 (마감 시 자동 취소)");
      end = table(
        ws,
        end + 3,
        ["No", "영업장 · 신청자", "신청 월", "받을 금액(VAT 포함)", "", "", "비고"],
        waiting.map((r, i) => [i + 1, `${shopName[r.shopId] || ""} ${r.applicantName}`, monthOf[r.cycleId] || "", Math.round(r.personalAmount * 1.1), "", "", ""]),
        { sumCols: [4], sumLabelCol: 2 },
      );
      section(end + 2, "3. 환불할 돈");
      table(
        ws,
        end + 3,
        ["No", "영업장 · 신청자", "신청 월", "환불할 금액(VAT 포함)", "", "", "비고"],
        refunds.map((r, i) => [i + 1, `${shopName[r.shopId] || ""} ${r.applicantName}`, monthOf[r.cycleId] || "", r.refundDue - r.refundedTotal, "", "", r.note || ""]),
        { sumCols: [4], sumLabelCol: 2 },
      );
    },
    `미수금보고서_${today}.xlsx`,
  ];
}

// ----------------------------------------------------------------- 12. AS 요청현황

export function asReportDoc(year, cases, shops) {
  const shopBy = Object.fromEntries(shops.map((x) => [x.id, x]));
  const mine = cases.filter((k) => (k.openedOn || "").startsWith(String(year)));
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  return [
    (wb) => {
      const ws = wb.addWorksheet(`${year} AS 요약`);
      widths(ws, [10, ...months.map(() => 7), 8]);
      title(ws, `${year}년 모바일 프린터기 AS 요청현황`, 14, "제조사 서비스센터 공유용");
      const repairs = mine.filter((k) => k.type === "REPAIR");
      const row = (label, fn) => [label, ...months.map((m) => repairs.filter((k) => k.openedOn.startsWith(m) && fn(k)).length)];
      const start = 4;
      const rows = [row("요청건수", () => true), row("처리완료", (k) => k.status === "CLOSED"), row("수리불가", (k) => k.status === "UNREPAIRABLE"), row("미 처리", (k) => k.status === "OPEN")].map((r, i) => [
        ...r,
        f(`SUM(B${start + 1 + i}:M${start + 1 + i})`, r.slice(1).reduce((a, b) => a + b, 0)),
      ]);
      table(ws, start, ["구분", ...months.map((m) => `${Number(m.slice(5))}월`), "SUM"], rows);

      const ws2 = wb.addWorksheet(`${year} AS 목록`);
      widths(ws2, [10, 12, 16, 15, 20, 30, 36, 10, 10]);
      title(ws2, `${year}년 AS·교환·반품 접수 목록`, 9);
      table(
        ws2,
        3,
        ["구분", "접수일자", "영업장명", "전화번호", "S/N", "증상", "배송요청주소", "현황", "무상"],
        mine.map((k) => {
          const sh = shopBy[k.shopId] || {};
          return [
            { REPAIR: "일반수리", EXCHANGE: "불량교환", RETURN: "반품" }[k.type],
            k.openedOn,
            sh.name || "",
            sh.phone || "",
            k.serial + (k.newSerial ? ` → ${k.newSerial}` : ""),
            k.reason || "",
            sh.address || "",
            { OPEN: "진행", CLOSED: "완료", UNREPAIRABLE: "수리불가" }[k.status],
            k.type === "REPAIR" ? (k.freeWarranty ? "무상" : "유상") : "",
          ];
        }),
      );
    },
    `AS요청현황_${year}.xlsx`,
  ];
}

// ----------------------------------------------------------------- 표시용

function statusKo(s) {
  return (
    {
      APPLIED: "신청",
      PAID: "입금 확인",
      CONFIRMED: "확정",
      ORDERED: "발주",
      SHIPPING: "배송 중",
      RETURNED_TO_SENDER: "반송",
      DELIVERED: "배송 완료",
      INVOICED: "계산서 발행",
      COMPLETED: "완료",
      REFUND_PENDING: "환불 대기",
    }[s] || s
  );
}

function deviceKo(s) {
  return { IN_STOCK: "재고", ASSIGNED: "배정", SHIPPED: "배송 중", DELIVERED: "사용 중", AWAITING_RECOVERY: "회수 대기", RECOVERED: "회수 완료", IN_REPAIR: "수리 중", SCRAPPED: "폐기" }[s] || s;
}

function invKo(s) {
  return { REQUESTED: "발행 대기", ISSUED: "발행", PAID: "수금" }[s] || "미요청";
}
