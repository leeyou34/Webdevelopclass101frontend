/** 운영 업무(할 일) 한 건을 눌렀을 때 갈 주소 */
export function taskLink(t) {
  if (t.page === "devices") return `/ops/devices${t.focusId ? `?focus=${t.focusId}` : ""}`;
  if (t.page === "report") return `/ops/report${t.month ? `?month=${t.month}` : ""}`;
  const p = new URLSearchParams();
  if (t.cycleId) p.set("cycle", t.cycleId);
  if (t.focusId) p.set("focus", t.focusId);
  const s = p.toString();
  return `/ops/orders${s ? `?${s}` : ""}`;
}

export const PRIORITY = {
  1: ["긴급", "error"],
  2: ["중요", "warning"],
  3: ["보통", "default"],
};

const DAY = 24 * 60 * 60 * 1000;
const parse = (d) => new Date(`${d}T00:00:00`);
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

export function daysBetween(from, to) {
  return Math.round((parse(to) - parse(from)) / DAY);
}

export function addDays(d, n) {
  return new Date(parse(d).getTime() + n * DAY).toLocaleDateString("sv-SE");
}

/** 날짜 묶음 제목: 밀린 일 / 오늘 / 내일 / 10월 5일 (월) */
export function dayTitle(d, today) {
  const diff = daysBetween(today, d);
  const date = parse(d);
  const md = `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY[date.getDay()]})`;
  if (diff === 0) return `오늘 · ${md}`;
  if (diff === 1) return `내일 · ${md}`;
  return md;
}

/** 할 일을 [밀린 일, 날짜별...] 묶음으로 나누고, 묶음 안에서는 중요도 순으로 정렬 */
export function groupTasks(tasks, today) {
  const byPriority = (a, b) => a.priority - b.priority || a.dueOn.localeCompare(b.dueOn);
  const overdue = tasks.filter((t) => t.dueOn < today).sort(byPriority);
  const groups = [];
  if (overdue.length) groups.push({ key: "overdue", title: "밀린 일", overdue: true, tasks: overdue });
  const dates = [...new Set(tasks.filter((t) => t.dueOn >= today).map((t) => t.dueOn))].sort();
  for (const d of dates) {
    groups.push({ key: d, title: dayTitle(d, today), tasks: tasks.filter((t) => t.dueOn === d).sort(byPriority) });
  }
  return groups;
}
