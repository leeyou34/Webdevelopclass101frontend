import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  List,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { HOME_LABEL, HOME_URL } from "../homeLink.js";
import { signout, todoApi } from "../api.js";
import AddTodo from "../components/AddTodo.jsx";
import TodoItem from "../components/TodoItem.jsx";
import OpsTasksPanel from "./ops/OpsTasksPanel.jsx";

export default function TodoPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    todoApi
      .list()
      .then((data) => alive && setItems(data))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  /** 서버가 돌려준 최신 목록으로 화면을 맞춥니다. 성공하면 true. */
  const run = useCallback(async (request) => {
    setBusy(true);
    setError("");
    try {
      setItems(await request());
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  function handleSignout() {
    signout();
    navigate("/login", { replace: true });
  }

  const remaining = items.filter((i) => !i.done).length;

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 700 }}>
            오늘의 할 일
          </Typography>
          {HOME_URL && (
            <Button color="inherit" href={HOME_URL}>
              {HOME_LABEL}
            </Button>
          )}
          <Button color="inherit" onClick={() => navigate("/ops")}>
            운영관리
          </Button>
          <Button color="inherit" onClick={handleSignout}>
            로그아웃
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={2}>
          <OpsTasksPanel />

          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700, pt: 1 }}>
            내 할 일
          </Typography>
          <AddTodo onAdd={(title) => run(() => todoApi.create(title))} disabled={busy} />

          {error && (
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress aria-label="불러오는 중" />
            </Box>
          ) : (
            <Paper variant="outlined">
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                {items.length === 0 ? "아직 할 일이 없습니다. 위에서 추가해 보세요." : `남은 일 ${remaining}개 / 전체 ${items.length}개`}
              </Typography>
              <List disablePadding>
                {items.map((item) => (
                  <TodoItem
                    key={item.id}
                    item={item}
                    onUpdate={(next) => run(() => todoApi.update(next))}
                    onDelete={(target) => run(() => todoApi.remove(target))}
                  />
                ))}
              </List>
            </Paper>
          )}
        </Stack>
      </Container>
    </>
  );
}
