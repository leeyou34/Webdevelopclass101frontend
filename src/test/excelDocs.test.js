import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { approvalDoc, invoiceListDoc, profitReportDoc, DEFAULT_SETTINGS } from "../pages/ops/excelDocs.js";

/** 문서 빌더를 실행해 시트의 값(수식은 계산 결과)을 2차원 배열로 돌려줍니다. */
function sheetValues(pair, sheet = 0) {
  const wb = new ExcelJS.Workbook();
  pair[0](wb);
  const ws = wb.worksheets[sheet];
  const rows = [];
  ws.eachRow((row) => rows.push(row.values.slice(1).map((v) => (v && typeof v === "object" && "result" in v ? v.result : v))));
  return rows;
}

const cycle = { id: "c1", month: "2026-10" };
const po = { id: "p1", cycleId: "c1", orderNo: "ON-20261008", orderedOn: "2026-10-08", androidQty: 12, iosQty: 4, bufferAndroid: 2, bufferIos: 0 };
const shops = [{ id: "s1", name: "한빛(방)", type: "SPECIALTY" }];
const req = (id, a, i, extra = {}) => ({
  id, cycleId: "c1", shopId: "s1", purchaseOrderId: "p1", applicantName: id, androidQty: a, iosQty: i,
  personalAmount: (a + i) * 143000, hqAmount: i * 30000, status: "COMPLETED", deliveredOn: "2026-10-27",
  paidOn: "2026-10-04", refundDue: 0, refundedTotal: 0, ...extra,
});

describe("업무 문서", () => {
  it("품의서는 예비 수량을 판매 금액에 넣지 않는다", () => {
    const rows = sheetValues(approvalDoc(po, cycle, [req("a", 10, 4)], [po], DEFAULT_SETTINGS));
    const profit = rows.find((r) => r.includes("예상 수익(신청분)"));
    // 신청분 안드로이드 10 · iOS 4 → 13,000원 × 14대
    expect(profit.at(-1)).toBe(182000);
    expect(rows.some((r) => r[0] === "안드로이드용 (예비·재고)" && r[1] === 2)).toBe(true);
  });

  it("수익보고는 실제 판매분으로 매출을 잡고 예비는 재고 매입으로 나눈다", () => {
    const requests = [req("a", 9, 4), req("returned", 0, 0)];
    const rows = sheetValues(profitReportDoc([po], requests, [], DEFAULT_SETTINGS));
    const line = rows.find((r) => r[1] === "ON-20261008");
    expect(line.slice(3, 9)).toEqual([9, 4, 9 * 143000 + 4 * 173000, 9 * 130000 + 4 * 160000, 9 * 13000 + 4 * 13000, 3 * 130000]);
  });

  it("발행 후 환불된 개인 앞 계산서는 빠지지 않고 수정 발행 필요로 표시된다", () => {
    const requests = [req("kept", 1, 0), req("returned", 0, 0, { refundDue: 157300, refundedTotal: 157300 })];
    const invoices = [
      { id: "i1", type: "PERSONAL", cycleId: "c1", requestId: "kept", amount: 143000, status: "ISSUED" },
      { id: "i2", type: "PERSONAL", cycleId: "c1", requestId: "returned", amount: 143000, status: "ISSUED" },
    ];
    const rows = sheetValues(invoiceListDoc(cycle, requests, shops, invoices), 1);
    const returned = rows.find((r) => r[2] === "returned");
    expect(returned[5]).toBe(143000);
    expect(returned[11]).toContain("수정세금계산서");
    expect(rows[1][0]).toContain("수정 발행 필요 1건");
  });
});
