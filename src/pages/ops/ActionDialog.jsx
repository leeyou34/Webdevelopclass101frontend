import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";

/**
 * 동작에 필요한 값을 받는 작은 창.
 * fields: [{ name, label, type: "text"|"number"|"date"|"select", options: [[value,label]], default, helper }]
 */
export default function ActionDialog({ open, title, description, fields = [], submitLabel = "실행", onClose, onSubmit }) {
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(Object.fromEntries(fields.map((f) => [f.name, f.default ?? ""])));
      setBusy(false);
    }
    // 창을 열 때만 초기화
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const out = {};
    for (const f of fields) {
      const v = values[f.name];
      if (v === "" || v === undefined) continue;
      out[f.name] = f.type === "number" ? Number(v) : v;
    }
    const ok = await onSubmit(out);
    setBusy(false);
    if (ok !== false) onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={submit} noValidate>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          {description && <DialogContentText sx={{ mb: 2 }}>{description}</DialogContentText>}
          <Stack spacing={2} sx={{ pt: description ? 0 : 1 }}>
            {fields.map((f) => (
              <TextField
                key={f.name}
                label={f.label}
                type={f.type === "select" ? undefined : f.type || "text"}
                select={f.type === "select"}
                value={values[f.name] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
                helperText={f.helper}
                size="small"
                fullWidth
                slotProps={f.type === "date" ? { inputLabel: { shrink: true } } : undefined}
              >
                {f.type === "select" &&
                  (f.options || []).map(([v, l]) => (
                    <MenuItem key={v} value={v}>
                      {l}
                    </MenuItem>
                  ))}
              </TextField>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>닫기</Button>
          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? "처리 중…" : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
