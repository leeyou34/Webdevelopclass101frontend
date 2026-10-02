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
    const pay = pathname.match(/^\/printer\/requests\/(\w+)\/payment$/);
    if (method === "POST" && pay) {
      const r = state.requests.find((x) => x.id === pay[1]);
      if (body.amount !== r.personalAmount) return json(400, { error: "입금액이 신청 금액과 다릅니다." });
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
    expect(await screen.findByText("2026-10 현황")).toBeInTheDocument();
    expect(screen.getByText("교환해 보냈지만 아직 회수하지 못한 불량 기기가 1대입니다.")).toBeInTheDocument();
    expect(screen.getByText("90,000원")).toBeInTheDocument();
  });

  it("신청 목록에서 입금 확인(동작 3)을 실행하면 상태가 바뀐다", async () => {
    const user = userEvent.setup();
    await backend.fetch("/printer/demo", { method: "POST", headers: { Authorization: "Bearer good-token" } });
    renderAt("/ops/orders");

    const row = (await screen.findByText("서0윤")).closest("tr");
    expect(within(row).getByText("신청")).toBeInTheDocument();
    await user.click(within(row).getByRole("button", { name: "입금 확인" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText("입금액")).toHaveValue(143000);
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
    const amount = within(dialog).getByLabelText("입금액");
    await user.clear(amount);
    await user.type(amount, "100000");
    await user.click(within(dialog).getByRole("button", { name: "확인" }));

    expect(await screen.findByText("입금액이 신청 금액과 다릅니다.")).toBeInTheDocument();
    expect(within(screen.getByText("서0윤").closest("tr")).getByText("신청")).toBeInTheDocument();
  });
});
