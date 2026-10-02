import { useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ops } from "../../api.js";
import { SHOP_TYPE } from "./labels.js";
import ActionDialog from "./ActionDialog.jsx";
import Notice from "./Notice.jsx";
import useLoad from "./useLoad.js";
import useOps from "./useOps.js";

export default function ShopsPage() {
  const { data, error, reload } = useLoad(() => ops.shops());
  const { notice, setNotice, run } = useOps(reload);
  const [open, setOpen] = useState(false);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress />;

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: "center" }}>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
          특약점은 개인이 먼저 입금하고, 직영 영업소는 본사가 한꺼번에 정산합니다. 연락처·주소는 일부를 가려서 입력하길 권합니다.
        </Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          영업장 등록
        </Button>
      </Stack>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>코드</TableCell>
                <TableCell>이름</TableCell>
                <TableCell>구분</TableCell>
                <TableCell>지역 · 팀</TableCell>
                <TableCell>담당</TableCell>
                <TableCell>연락처</TableCell>
                <TableCell>주소</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 3 }}>
                    등록된 영업장이 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.code}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{SHOP_TYPE[s.type]}</TableCell>
                  <TableCell>{[s.division, s.team].filter(Boolean).join(" · ")}</TableCell>
                  <TableCell>{s.managerName}</TableCell>
                  <TableCell>{s.phone}</TableCell>
                  <TableCell>{s.address}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <ActionDialog
        open={open}
        title="영업장 등록"
        fields={[
          { name: "code", label: "코드", helper: "예: S009" },
          { name: "name", label: "이름", helper: "예: 양0특약점" },
          { name: "type", label: "구분", type: "select", options: Object.entries(SHOP_TYPE), default: "SPECIALTY" },
          { name: "division", label: "지역" },
          { name: "team", label: "팀" },
          { name: "managerName", label: "담당(가려서)", helper: "예: 김0범" },
          { name: "phone", label: "연락처(가려서)", helper: "예: 010-0000-1234" },
          { name: "address", label: "주소(시·구까지)" },
        ]}
        submitLabel="등록"
        onClose={() => setOpen(false)}
        onSubmit={(v) => run(() => ops.createShop(v), "영업장을 등록했습니다.")}
      />
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </Stack>
  );
}
