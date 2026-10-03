import { Alert, Snackbar } from "@mui/material";

export default function Notice({ notice, onClose }) {
  return (
    <Snackbar
      open={Boolean(notice)}
      autoHideDuration={notice?.severity === "error" ? 8000 : 3000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      {notice ? (
        <Alert severity={notice.severity} onClose={onClose} variant="filled" sx={{ width: "100%" }}>
          {notice.text}
        </Alert>
      ) : (
        <span />
      )}
    </Snackbar>
  );
}
