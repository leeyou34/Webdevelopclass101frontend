import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "../App.jsx";

/** 운영관리 API를 흉내 내는 가짜 서버 (응답 형식은 실제 /printer API와 같음) */
function fakeOps() {
  const state = {
    shops: [],
    cycles: [],
    requests: [],
    calls: [],
  };
  const dashboard = () => ({
    asOf: "2026-10-02",
    month: "2026-10",
    requestsByStatus: { APPLIED: state.requests.filter((r) => r.status === "APPLIED").length },
    deliveredThisMonth: { android: 0, ios: 0 },
    invoicedThisMonth: { android: 0, ios: 0 },
    stock: { android: 2, ios: 1 },
    receivablesAmount: 90000,
    receivablesCount: 1,
    overdueAmount: 0,
    overdueCount: 0,
    unrecoveredExchanges: 1,
    openRepairs: 0,
    pendingRefunds: 0,
    suggestions: [{ level: "warning", message: "교환해 보냈지만 아직 회수하지 못한 불량 기기가 1대입니다.", targetType: "case", targetId: null }],
  });
  const summary = (n) => ({
    requests: n, cancelled: 1, delivered: { android: n, ios: 1 }, invoiced: { android: n, ios: 0 },
    revenue: n * 143000, cost: n * 130000, profit: n * 13000, collected: n * 100000, returns: 0, exchanges: 1, repairs: 0,
  });
  const analytics = (from, to) => ({
    from, to, unit: "month", previousFrom: "2025-01-01", previousTo: "2025-09-30",
    summary: summary(12), previous: summary(10),
    series: [
      { key: "2026-08", label: "26.8", android: 5, ios: 1, revenue: 888000, profit: 70000, collected: 700000 },
      { key: "2026-09", label: "26.9", android: 7, ios: 0, revenue: 1001000, profit: 91000, collected: 900000 },
    ],
    byShop: [{ shopCode: "S001", shopName: "한빛(방)", android: 7, ios: 1, revenue: 1174000 }],
  });
  const tasks = [
    { key: "refund-r1", dueOn: "2026-09-30", priority: 1, category: "환불", title: "한빛(방) 서0윤에게 143,000원 환불",
      detail: "고객에게 돌려줄 돈입니다.", page: "orders", cycleId: "c1", focusId: "r1", month: null },
    { key: "close-c1", dueOn: "2026-10-07", priority: 2, category: "신청·입금", title: "2026-10 신청 마감",
      detail: "", page: "orders", cycleId: "c1", focusId: null, month: null },
  ];
  state.analyticsCalls = [];
  const json = (status, body) =>
    Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

  const fetch = vi.fn((url, init = {}) => {
    const { pathname, searchParams } = new URL(url, "http://localhost");
    const method = init.method || "GET";
    const body = init.body ? JSON.parse(init.body) : {};
    state.calls.push([method, pathname, body]);
    if (init.headers?.Authorization !== "Bearer good-token") return json(401, {});

    if (method === "GET") {
      if (pathname === "/printer/dashboard") return json(200, dashboard());
      if (pathname === "/printer/analytics") state.analyticsCalls.push(searchParams.get("from"));
      if (pathname === "/printer/analytics") return json(200, analytics(searchParams.get("from"), searchParams.get("to")));
      if (pathname === "/printer/tasks") return json(200, { asOf: "2026-10-02", tasks: state.shops.length ? tasks : [] });
      if (pathname === "/todo") return json(200, { data: [] });
      if (pathname === "/printer/shops") return json(200, state.shops);
      if (pathname === "/printer/cycles") return json(200, state.cycles);
      if (pathname === "/printer/requests")
        return json(200, state.requests.filter((r) => !searchParams.get("cycleId") || r.cycleId === searchParams.get("cycleId")));
      if (["/printer/purchase-orders", "/printer/invoices", "/printer/devices", "/printer/cases", "/printer/activity"].includes(pathname))
        return json(200, []);
    }
    if (method === "POST" && pathname === "/printer/demo") {
      state.shops = [{ id: "s1", code: "S001", name: "한빛(방)", type: "SPECIALTY" }];
      state.cycles = [{ id: "c1", month: "2026-10", closesOn: "2026-10-07", status: "OPEN" }];
      state.requests = [
        { id: "r1", cycleId: "c1", shopId: "s1", applicantName: "서0윤", androidQty: 1, iosQty: 0, personalAmount: 143000, hqAmount: 0, status: "APPLIED" },
      ];
      return json(200, { shops: 1 });
    }
    if (method === "POST" && pathname === "/printer/chat") {
      const m = body.message;
      if (m === "도움말") return json(200, { answer: "모바일 프린터 운영 업무만 답하는 안내 챗봇입니다.", links: [], suggestions: ["재고 몇 대야?"] });
      if (m.includes("재고")) return json(200, { answer: "재고는 3대입니다(안드로이드 2 · iOS 1).", links: [{ label: "기기 화면", path: "/ops/devices" }], suggestions: [] });
      return json(200, { answer: "질문을 업무 항목과 연결하지 못했습니다.", links: [], suggestions: [] });
    }
    const pay = pathname.match(/^\/printer\/requests\/(\w+)\/payment$/);
    if (method === "POST" && pay) {
      const r = state.requests.find((x) => x.id === pay[1]);
      if (body.amount !== Math.round(r.personalAmount * 1.1)) return json(400, { error: "입금액이 신청 금액과 다릅니다." });
      r.status = "PAID";
      return json(200, r);
    }
    return json(404, { error: "없는 주소" });
  });
  return { fetch, state };
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("모바일 프린터 운영관리", () => {
  let backend;
  beforeEach(() => {
    backend = fakeOps();
    globalThis.fetch = backend.fetch;
    localStorage.setItem("ACCESS_TOKEN", "good-token");
  });

  it("영업장이 없으면 체험 데이터를 만들 수 있고, 만든 뒤 현황과 챙길 일을 보여 준다", async () => {
    const user = userEvent.setup();
    renderAt("/ops");
    await user.click(await screen.findByRole("button", { name: "체험 데이터 만들기" }));
    expect(await screen.findByText("배송 완료 기준")).toBeInTheDocument();
    expect(screen.getByText("13대")).toBeInTheDocument();
    expect(screen.getByText(/지난 기간 대비 ▲ 2대/)).toBeInTheDocument();
    expect(screen.getByText("한빛(방) 서0윤에게 143,000원 환불")).toBeInTheDocument();
    expect(screen.getByText(/90,000원 · 1건/)).toBeInTheDocument();
  });

  it("기간 버튼을 바꾸면 그 기간으로 다시 불러온다", async () => {
    const user = userEvent.setup();
    await backend.fetch("/printer/demo", { method: "POST", headers: { Authorization: "Bearer good-token" } });
    renderAt("/ops");
    await screen.findByText("배송 완료 기준");
    const before = backend.state.analyticsCalls.length;
    await user.click(screen.getByRole("button", { name: "올해" }));
    await waitFor(() => expect(backend.state.analyticsCalls.length).toBeGreaterThan(before));
    expect(backend.state.analyticsCalls.at(-1)).toMatch(/^\d{4}-01-01$/);
    await user.click(screen.getByRole("button", { name: "직접 설정" }));
    expect(screen.getByLabelText("시작일")).toBeInTheDocument();
  });

  it("할 일 화면에 운영 업무가 날짜·중요도순으로 나오고, 누르면 해당 신청 줄로 이동한다", async () => {
    const user = userEvent.setup();
    await backend.fetch("/printer/demo", { method: "POST", headers: { Authorization: "Bearer good-token" } });
    renderAt("/");
    expect(await screen.findByText("운영 업무")).toBeInTheDocument();
    expect(screen.getByText(/밀린 일 · 1건/)).toBeInTheDocument();
    expect(screen.getByText("긴급")).toBeInTheDocument();
    expect(screen.getByText(/2일 지남/)).toBeInTheDocument();
    await user.click(screen.getByText("한빛(방) 서0윤에게 143,000원 환불"));
    const row = (await screen.findByText("서0윤")).closest("tr");
    expect(row).toHaveClass("Mui-selected");
  });

  it("신청 목록에서 입금 확인(동작 3)을 실행하면 상태가 바뀐다", async () => {
    const user = userEvent.setup();
    await backend.fetch("/printer/demo", { method: "POST", headers: { Authorization: "Bearer good-token" } });
    renderAt("/ops/orders");

    const row = (await screen.findByText("서0윤")).closest("tr");
    expect(within(row).getByText("신청")).toBeInTheDocument();
    await user.click(within(row).getByRole("button", { name: "입금 확인" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText("입금액(VAT 포함)")).toHaveValue(157300);
    await user.click(within(dialog).getByRole("button", { name: "확인" }));

    await waitFor(() => expect(within(screen.getByText("서0윤").closest("tr")).getByText("입금 확인")).toBeInTheDocument());
    expect(backend.state.calls.some(([m, p]) => m === "POST" && p === "/printer/requests/r1/payment")).toBe(true);
  });

  it("금액이 다르면 서버의 오류 문구를 그대로 보여 준다", async () => {
    const user = userEvent.setup();
    await backend.fetch("/printer/demo", { method: "POST", headers: { Authorization: "Bearer good-token" } });
    renderAt("/ops/orders");

    const row = (await screen.findByText("서0윤")).closest("tr");
    await user.click(within(row).getByRole("button", { name: "입금 확인" }));
    const dialog = await screen.findByRole("dialog");
    const amount = within(dialog).getByLabelText("입금액(VAT 포함)");
    await user.clear(amount);
    await user.type(amount, "100000");
    await user.click(within(dialog).getByRole("button", { name: "확인" }));

    expect(await screen.findByText("입금액이 신청 금액과 다릅니다.")).toBeInTheDocument();
    expect(within(screen.getByText("서0윤").closest("tr")).getByText("신청")).toBeInTheDocument();
  });

  it("업무 챗봇에 물으면 데이터로 답하고, 링크를 누르면 해당 화면으로 간다", async () => {
    const user = userEvent.setup();
    await backend.fetch("/printer/demo", { method: "POST", headers: { Authorization: "Bearer good-token" } });
    renderAt("/ops");
    await user.click(await screen.findByRole("button", { name: "업무 챗봇 열기" }));
    expect(await screen.findByText(/운영 업무만 답하는/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "재고 몇 대야?" }));
    expect(await screen.findByText(/재고는 3대입니다/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "기기 화면" }));
    expect(await screen.findByLabelText("시리얼·영업장 검색")).toBeInTheDocument();
  });
});
