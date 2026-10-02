import { useState } from "react";
import { Button, Paper, Stack, TextField } from "@mui/material";

export default function AddTodo({ onAdd, disabled }) {
  const [title, setTitle] = useState("");

  async function submit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const ok = await onAdd(trimmed);
    if (ok) setTitle("");
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack component="form" direction="row" spacing={1.5} onSubmit={submit}>
        <TextField
          label="새 할 일"
          placeholder="예: 견적서 보내기"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 200 } }}
          size="small"
          fullWidth
        />
        <Button type="submit" variant="contained" disabled={disabled || !title.trim()} sx={{ flexShrink: 0 }}>
          추가
        </Button>
      </Stack>
    </Paper>
  );
}
