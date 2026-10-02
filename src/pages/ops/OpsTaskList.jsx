import { Box, Chip, List, ListItemButton, ListItemText, ListSubheader, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router";
import { PRIORITY, daysBetween, groupTasks, taskLink } from "./tasks.js";

/** 날짜별·중요도순 운영 업무 목록. 한 줄을 누르면 그 일을 처리하는 화면(해당 줄)으로 이동합니다. */
export default function OpsTaskList({ tasks, today, dense = false }) {
  const navigate = useNavigate();
  const groups = groupTasks(tasks, today);

  if (tasks.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        이 기간에 할 일이 없습니다.
      </Typography>
    );
  }

  return (
    <List dense={dense} disablePadding>
      {groups.map((g) => (
        <li key={g.key}>
          <ul style={{ padding: 0 }}>
            <ListSubheader
              sx={{
                lineHeight: "32px",
                fontWeight: 700,
                bgcolor: "background.default",
                color: g.overdue ? "error.main" : "text.primary",
              }}
            >
              {g.title} · {g.tasks.length}건
            </ListSubheader>
            {g.tasks.map((t) => {
              const [plabel, pcolor] = PRIORITY[t.priority] || PRIORITY[3];
              const late = g.overdue ? daysBetween(t.dueOn, today) : 0;
              return (
                <ListItemButton key={t.key} onClick={() => navigate(taskLink(t))} divider>
                  <Chip size="small" label={plabel} color={pcolor} variant={pcolor === "default" ? "outlined" : "filled"} sx={{ mr: 1.5, minWidth: 48 }} />
                  <ListItemText
                    primary={t.title}
                    secondary={
                      <>
                        <Box component="span" sx={{ color: "text.secondary" }}>
                          {t.category}
                        </Box>
                        {late > 0 && (
                          <Box component="span" sx={{ color: "error.main", ml: 1 }}>
                            {late}일 지남
                          </Box>
                        )}
                        {t.detail && <Box component="span" sx={{ ml: 1 }}>· {t.detail}</Box>}
                      </>
                    }
                  />
                  <ChevronRightIcon color="action" />
                </ListItemButton>
              );
            })}
          </ul>
        </li>
      ))}
    </List>
  );
}
