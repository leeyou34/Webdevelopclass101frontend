import {
  Alert,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ops } from "../../api.js";
import useLoad from "./useLoad.js";

export default function ActivityPage() {
  const { data, error } = useLoad(() => ops.activity());

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress />;

  return (
    <Paper variant="outlined">
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        모든 동작은 누가 언제 무엇을 했는지 기록으로 남습니다. 번호는 기획서의 동작 번호입니다.
      </Typography>
      <TableContainer sx={{ maxHeight: 640 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>시각</TableCell>
              <TableCell>동작</TableCell>
              <TableCell>내용</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ color: "text.secondary", py: 3 }}>
                  아직 기록이 없습니다.
                </TableCell>
              </TableRow>
            )}
            {data.map((a) => (
              <TableRow key={a.id}>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  {a.createdAt ? new Date(a.createdAt).toLocaleString("ko-KR") : ""}
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  {a.action > 0 && <Chip size="small" label={a.action} sx={{ mr: 1 }} />}
                  {a.label}
                </TableCell>
                <TableCell>{a.detail}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
