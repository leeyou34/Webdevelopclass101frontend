/**
 * 백엔드(API) 호출 모음.
 * 로그인 토큰은 브라우저 localStorage에 보관하고, 요청마다 Authorization 헤더로 보냅니다.
 */

const TOKEN_KEY = "ACCESS_TOKEN";

function resolveBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:8080";
  }
  return ""; // 같은 도메인에서 API를 함께 서비스하는 경우
}

export const API_BASE_URL = resolveBaseUrl();

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY); // 2022 버전은 "null" 문자열을 저장하던 버그가 있었음
  } catch {
    /* 저장소를 쓸 수 없는 환경이면 무시 */
  }
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** 로그인이 풀렸을 때 화면이 반응할 수 있도록 알려 주는 콜백 */
let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export async function call(path, method = "GET", body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(API_BASE_URL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요.");
  }

  let json = null;
  try {
    json = await response.json();
  } catch {
    /* 본문이 없는 응답 */
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      setToken(null);
      onUnauthorized();
    }
    throw new ApiError(response.status, json?.error || `요청을 처리하지 못했습니다. (${response.status})`);
  }
  return json;
}

export async function signin({ email, password }) {
  const user = await call("/auth/signin", "POST", { email, password });
  setToken(user.token);
  return user;
}

export function signup({ username, email, password, inviteCode }) {
  return call("/auth/signup", "POST", { username, email, password, inviteCode: inviteCode || null });
}

export function signout() {
  setToken(null);
}

export const todoApi = {
  list: () => call("/todo").then((r) => r.data),
  create: (title) => call("/todo", "POST", { title }).then((r) => r.data),
  update: (item) => call("/todo", "PUT", { id: item.id, title: item.title, done: item.done }).then((r) => r.data),
  remove: (item) => call("/todo", "DELETE", { id: item.id }).then((r) => r.data),
};

/** 모바일 프린터 운영관리 API. 동작 번호는 기획서 "동작 목록"과 같습니다. */
const q = (params) => {
  const s = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return s ? `?${s}` : "";
};

export const ops = {
  dashboard: (asOf) => call(`/printer/dashboard${q({ asOf })}`),
  shops: () => call("/printer/shops"),
  cycles: () => call("/printer/cycles"),
  requests: (cycleId) => call(`/printer/requests${q({ cycleId })}`),
  purchaseOrders: () => call("/printer/purchase-orders"),
  devices: (status) => call(`/printer/devices${q({ status })}`),
  cases: () => call("/printer/cases"),
  invoices: () => call("/printer/invoices"),
  adjustments: () => call("/printer/adjustments"),
  activity: () => call("/printer/activity"),
  report: (month) => call(`/printer/reports/monthly${q({ month })}`),
  demo: () => call("/printer/demo", "POST", {}),
  createShop: (body) => call("/printer/shops", "POST", body),
  /** 동작 실행: POST path body */
  act: (path, body) => call(path, "POST", body ?? {}),
};
