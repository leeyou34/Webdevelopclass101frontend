/** 화면에 보이는 한국어 이름과 색 */

export const REQUEST_STATUS = {
  APPLIED: ["신청", "default"],
  PAID: ["입금 확인", "info"],
  CONFIRMED: ["확정", "info"],
  ORDERED: ["발주", "primary"],
  SHIPPING: ["배송 중", "primary"],
  RETURNED_TO_SENDER: ["반송", "warning"],
  DELIVERED: ["배송 완료", "secondary"],
  INVOICED: ["계산서 발행", "secondary"],
  COMPLETED: ["완료", "success"],
  CANCELLED_UNPAID: ["미입금 취소", "default"],
  CANCELLED: ["취소", "default"],
  REFUND_PENDING: ["환불 대기", "warning"],
  REFUNDED: ["환불 완료", "default"],
};

export const DEVICE_STATUS = {
  IN_STOCK: ["재고", "success"],
  ASSIGNED: ["배정됨", "info"],
  SHIPPED: ["배송 중", "primary"],
  DELIVERED: ["사용 중", "default"],
  AWAITING_RECOVERY: ["회수 대기", "warning"],
  RECOVERED: ["회수 완료(불량)", "default"],
  IN_REPAIR: ["수리 중", "warning"],
  SCRAPPED: ["폐기", "default"],
};

export const CASE_TYPE = { RETURN: "반품", EXCHANGE: "불량 교환", REPAIR: "AS 수리" };
export const CASE_STATUS = {
  OPEN: ["진행 중", "warning"],
  CLOSED: ["완료", "success"],
  UNREPAIRABLE: ["수리 불가", "default"],
};
export const INVOICE_TYPE = { PERSONAL: "개인 앞", HQ: "본사 앞" };
export const INVOICE_STATUS = {
  REQUESTED: ["발행 대기", "warning"],
  ISSUED: ["발행됨", "info"],
  PAID: ["수금 완료", "success"],
};
export const MODEL = { ANDROID: "안드로이드", IOS: "iOS" };
export const SHOP_TYPE = { SPECIALTY: "방판 특약점", DIRECT: "방판 직영 영업소", LIRICOS: "리리코스 지사" };

export const won = (n) => `${Number(n || 0).toLocaleString("ko-KR")}원`;
export const today = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD (로컬 시간)
export const thisMonth = () => today().slice(0, 7);

/** 개인 입금은 VAT 포함으로 받습니다(143,000 → 157,300). */
export const withVat = (n) => Math.round((Number(n) || 0) * 1.1);

/** 시리얼 앞자리로 기종 판별 (AMR70KA·AMB7VKA는 예전 라벨 표기) */
export function modelOfSerial(serial) {
  const s = (serial || "").trim().toUpperCase();
  if (s.startsWith("AMR7OKA") || s.startsWith("AMR70KA")) return "ANDROID";
  if (s.startsWith("AMR7VKA") || s.startsWith("AMB7VKA")) return "IOS";
  return null;
}
