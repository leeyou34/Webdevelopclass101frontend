import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "../App.jsx";

/** 백엔드를 흉내 내는 가짜 서버: 응답 형식은 실제 API와 같습니다. */
function fakeBackend() {
  let todos = [];
  let seq = 0;
  const json = (status, body) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
  return vi.fn((url, init = {}) => {
    const path = new URL(url, "http://localhost").pathname;
    const method = init.method || "GET";
    const body = init.body ? JSON.parse(init.body) : {};
    const authed = init.headers?.Authorization === "Bearer good-token";
    if (path === "/auth/signin") {
      return body.password === "password123"
        ? json(200, { id: "u1", username: "테스트", email: body.email, token: "good-token" })
        : json(401, { error: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }
    if (path === "/auth/signup") {
      return body.inviteCode === "WELCOME"
        ? json(200, { id: "u2", username: body.username, email: body.email, token: null })
        : json(400, { error: "초대 코드가 올바르지 않습니다." });
    }
    if (path === "/todo") {
      if (!authed) return json(401, {});
      if (method === "POST") todos = [...todos, { id: String(++seq), title: body.title, done: false }];
      if (method === "PUT") todos = todos.map((t) => (t.id === body.id ? { ...t, title: body.title, done: body.done } : t));
      if (method === "DELETE") todos = todos.filter((t) => t.id !== body.id);
      return json(200, { data: todos });
    }
    return json(404, {});
  });
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("Todo 앱", () => {
  beforeEach(() => {
    globalThis.fetch = fakeBackend();
  });

  it("로그인하지 않으면 로그인 화면으로 보낸다", () => {
    renderAt("/");
    expect(screen.getByRole("heading", { name: "로그인" })).toBeInTheDocument();
  });

  it("비밀번호가 틀리면 서버 메시지를 보여 준다", async () => {
    const user = userEvent.setup();
    renderAt("/login");
    await user.type(screen.getByLabelText("이메일"), "a@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "wrong");
    await user.click(screen.getByRole("button", { name: "로그인" }));
    expect(await screen.findByText("이메일 또는 비밀번호가 올바르지 않습니다.")).toBeInTheDocument();
  });

  it("초대 코드가 틀리면 가입되지 않는다", async () => {
    const user = userEvent.setup();
    renderAt("/signup");
    await user.type(screen.getByLabelText("이름"), "방문자");
    await user.type(screen.getByLabelText("이메일"), "v@example.com");
    await user.type(screen.getByLabelText(/^비밀번호/), "password123");
    await user.type(screen.getByLabelText(/^초대 코드/), "WRONG");
    await user.click(screen.getByRole("button", { name: "가입하기" }));
    expect(await screen.findByText("초대 코드가 올바르지 않습니다.")).toBeInTheDocument();
  });

  it("로그인 후 할 일을 추가·완료·수정·삭제한다", async () => {
    const user = userEvent.setup();
    renderAt("/login");
    await user.type(screen.getByLabelText("이메일"), "a@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "password123");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByText("아직 할 일이 없습니다. 위에서 추가해 보세요.")).toBeInTheDocument();
    expect(localStorage.getItem("ACCESS_TOKEN")).toBe("good-token");

    await user.type(screen.getByLabelText("새 할 일"), "견적서 보내기");
    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(await screen.findByDisplayValue("견적서 보내기")).toBeInTheDocument();
    expect(screen.getByText("남은 일 1개 / 전체 1개")).toBeInTheDocument();

    await user.click(screen.getByLabelText('"견적서 보내기" 완료 표시'));
    expect(await screen.findByText("남은 일 0개 / 전체 1개")).toBeInTheDocument();

    const field = screen.getByLabelText("할 일 내용");
    await user.click(field);
    await user.clear(field);
    await user.type(field, "견적서 최종본 보내기{Enter}");
    expect(await screen.findByDisplayValue("견적서 최종본 보내기")).toBeInTheDocument();

    await user.click(screen.getByLabelText('"견적서 최종본 보내기" 삭제'));
    expect(await screen.findByText("아직 할 일이 없습니다. 위에서 추가해 보세요.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "로그아웃" }));
    expect(screen.getByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(localStorage.getItem("ACCESS_TOKEN")).toBeNull();
  });

  it("토큰이 만료되면 로그인 화면으로 돌아간다", async () => {
    localStorage.setItem("ACCESS_TOKEN", "expired-token");
    renderAt("/");
    await waitFor(() => expect(screen.getByRole("heading", { name: "로그인" })).toBeInTheDocument());
    expect(localStorage.getItem("ACCESS_TOKEN")).toBeNull();
  });
});
