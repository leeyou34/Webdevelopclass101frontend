import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Box, Button, Chip, Fab, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import { ops } from "../../api.js";

/** 업무 안내 챗봇(규칙 기반, 무료). 질문은 우리 서버에서만 처리됩니다. */
export default function ChatWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [log, setLog] = useState([]);
  const endRef = useRef(null);

  async function ask(message) {
    const m = message.trim();
    if (!m || busy) return;
    setLog((l) => [...l, { from: "me", text: m }]);
    setText("");
    setBusy(true);
    try {
      const r = await ops.chat(m);
      setLog((l) => [...l, { from: "bot", ...r }]);
    } catch (err) {
      setLog((l) => [...l, { from: "bot", answer: err.message, links: [], suggestions: [] }]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (open && log.length === 0) {
      ops
        .chat("도움말")
        .then((r) => setLog([{ from: "bot", ...r }]))
        .catch(() => setLog([{ from: "bot", answer: "챗봇을 불러오지 못했습니다.", links: [], suggestions: [] }]));
    }
  }, [open, log.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [log, busy]);

  const last = [...log].reverse().find((m) => m.from === "bot");

  return (
    <>
      {!open && (
        <Fab color="primary" aria-label="업무 챗봇 열기" onClick={() => setOpen(true)} sx={{ position: "fixed", right: 20, bottom: 20, zIndex: 1200 }}>
          <ChatIcon />
        </Fab>
      )}
      {open && (
        <Paper
          elevation={8}
          role="dialog"
          aria-label="업무 챗봇"
          sx={{
            position: "fixed",
            right: { xs: 8, sm: 20 },
            bottom: { xs: 8, sm: 20 },
            width: { xs: "calc(100vw - 16px)", sm: 380 },
            height: { xs: "70vh", sm: 520 },
            display: "flex",
            flexDirection: "column",
            zIndex: 1300,
            overflow: "hidden",
          }}
        >
          <Stack direction="row" sx={{ alignItems: "center", px: 2, py: 1, bgcolor: "primary.main", color: "primary.contrastText" }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                업무 챗봇
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                모바일 프린터 운영 질문만 답합니다
              </Typography>
            </Box>
            <IconButton aria-label="닫기" onClick={() => setOpen(false)} sx={{ color: "inherit" }}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Stack spacing={1.5} sx={{ flex: 1, overflow: "auto", p: 1.5, bgcolor: "background.default" }}>
            {log.map((m, i) =>
              m.from === "me" ? (
                <Box key={i} sx={{ alignSelf: "flex-end", maxWidth: "85%", bgcolor: "primary.main", color: "primary.contrastText", px: 1.5, py: 1, borderRadius: 2 }}>
                  <Typography variant="body2">{m.text}</Typography>
                </Box>
              ) : (
                <Box key={i} sx={{ alignSelf: "flex-start", maxWidth: "92%", bgcolor: "background.paper", border: "1px solid", borderColor: "divider", px: 1.5, py: 1, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                    {m.answer}
                  </Typography>
                  {m.links?.length > 0 && (
                    <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: "wrap" }} useFlexGap>
                      {m.links.map((l) => (
                        <Button key={l.path + l.label} size="small" variant="outlined" onClick={() => navigate(l.path)}>
                          {l.label}
                        </Button>
                      ))}
                    </Stack>
                  )}
                </Box>
              ),
            )}
            {busy && (
              <Typography variant="caption" color="text.secondary">
                찾는 중…
              </Typography>
            )}
            <div ref={endRef} />
          </Stack>
          {last?.suggestions?.length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ px: 1.5, pt: 1, flexWrap: "wrap" }} useFlexGap>
              {last.suggestions.map((s) => (
                <Chip key={s} label={s} size="small" onClick={() => ask(s.replace(" (시리얼 입력)", ""))} />
              ))}
            </Stack>
          )}
          <Stack
            component="form"
            direction="row"
            spacing={1}
            sx={{ p: 1.5 }}
            onSubmit={(e) => {
              e.preventDefault();
              ask(text);
            }}
          >
            <TextField size="small" fullWidth placeholder="예: 오늘 할 일, 미수금, 시리얼 번호" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
            <IconButton type="submit" color="primary" aria-label="보내기" disabled={busy || !text.trim()}>
              <SendIcon />
            </IconButton>
          </Stack>
        </Paper>
      )}
    </>
  );
}
