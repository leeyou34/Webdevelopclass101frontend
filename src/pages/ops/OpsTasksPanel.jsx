import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router";
import { Button, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { ops } from "../../api.js";
import { today as todayStr } from "./labels.js";
import { addDays } from "./tasks.js";
import OpsTaskList from "./OpsTaskList.jsx";

const RANGES = [
  ["today", "오늘까지"],
  ["week", "이번 주"],
  ["all", "전체"],
];

/** 할 일 화면 위쪽: 운영관리 시스템이 만든 날짜별·중요도순 업무. 운영 데이터가 없으면 아무것도 그리지 않습니다. */
export default function OpsTasksPanel() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState("week");

  useEffect(() => {
    let alive = true;
    ops
      .tasks()
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null));
    return () => {
      alive = false;
    };
  }, []);

  if (!data || data.tasks.length === 0) return null;

  const today = data.asOf || todayStr();
  const limit = range === "today" ? today : range === "week" ? addDays(today, 6) : null;
  const shown = limit ? data.tasks.filter((t) => t.dueOn <= limit) : data.tasks;
  const urgent = data.tasks.filter((t) => t.dueOn <= today).length;

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ px: 2, pt: 1.5, pb: 1, alignItems: { sm: "center" } }}>
        <Stack sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
            운영 업무
          </Typography>
          <Typography variant="body2" color="text.secondary">
            오늘까지 처리할 일 {urgent}건 · 누르면 처리하는 화면으로 이동합니다
          </Typography>
        </Stack>
        <ToggleButtonGroup size="small" exclusive value={range} onChange={(_, v) => v && setRange(v)} aria-label="기간">
          {RANGES.map(([v, l]) => (
            <ToggleButton key={v} value={v}>
              {l}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Button size="small" component={RouterLink} to="/ops">
          대시보드
        </Button>
      </Stack>
      <OpsTaskList tasks={shown} today={today} />
    </Paper>
  );
}
