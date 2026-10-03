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
import { SHOP_TYPE, today } from "./labels.js";
import ActionDialog from "./ActionDialog.jsx";
import Notice from "./Notice.jsx";
import useLoad from "./useLoad.js";
import useOps from "./useOps.js";

export default function ShopsPage() {
  const { data, error, reload } = useLoad(() => ops.shops());
  const { notice, setNotice, run } = useOps(reload);
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState(null);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress />;

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: "center" }}>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
          방판 특약점은 개인이 먼저 입금(VAT 포함)하고, 직영 영업소는 본사가 한꺼번에 정산하며, 리리코스 지사는 개인과 본사가 나눠 냅니다. 연락처·주소는 일부를 가려서 입력하길 권합니다.
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
                <TableCell>상태</TableCell>
                <TableCell>동작</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ color: "text.secondary", py: 3 }}>
                    등록된 영업장이 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {data.map((s) => (
                <TableRow key={s.id} sx={s.active ? undefined : { opacity: 0.55 }}>
                  <TableCell>{s.code}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{SHOP_TYPE[s.type]}</TableCell>
                  <TableCell>{[s.division, s.team].filter(Boolean).join(" · ")}</TableCell>
                  <TableCell>{s.managerName}</TableCell>
                  <TableCell>{s.phone}</TableCell>
                  <TableCell>{s.address}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{s.active ? "정상" : `폐쇄 ${s.closedOn || ""}`}{s.note ? ` · ${s.note}` : ""}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Button
                      size="small"
                      onClick={() =>
                        setDialog({
                          title: `${s.name} 정보 변경`,
                          description: "영업장 이름이 바뀌었거나(예: 영업소 명칭 변경) 연락처·주소가 바뀐 경우에 고칩니다. 과거 신청 기록은 그대로 이어집니다.",
                          fields: [
                            { name: "name", label: "이름", default: s.name },
                            { name: "type", label: "구분", type: "select", options: Object.entries(SHOP_TYPE), default: s.type },
                            { name: "team", label: "팀", default: s.team || "" },
                            { name: "managerName", label: "담당(가려서)", default: s.managerName || "" },
                            { name: "phone", label: "연락처(가려서)", default: s.phone || "" },
                            { name: "address", label: "주소(시·구까지)", default: s.address || "" },
                          ],
                          submitLabel: "저장",
                          onSubmit: (v) => run(() => ops.updateShop(s.id, v), "영업장 정보를 바꿨습니다."),
                        })
                      }
                    >
                      수정
                    </Button>
                    {s.active ? (
                      <Button
                        size="small"
                        color="warning"
                        onClick={() =>
                          setDialog({
                            title: `${s.name} 폐쇄`,
                            description: "폐점·통합된 영업장입니다. 폐쇄하면 새 신청을 받지 않고, 지난 기록과 보고서에는 상태와 함께 남습니다.",
                            fields: [
                              { name: "date", label: "폐쇄일", type: "date", default: today() },
                              { name: "note", label: "사유", default: "폐점" , helper: "예: ○○(영)으로 통합" },
                            ],
                            submitLabel: "폐쇄",
                            onSubmit: (v) => run(() => ops.act(`/printer/shops/${s.id}/close`, v), "영업장을 폐쇄했습니다."),
                          })
                        }
                      >
                        폐쇄
                      </Button>
                    ) : (
                      <Button size="small" onClick={() => run(() => ops.act(`/printer/shops/${s.id}/reopen`), "다시 열었습니다.")}>
                        다시 열기
                      </Button>
                    )}
                  </TableCell>
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
          { name: "type", label: "구분", type: "select", options: Object.entries(SHOP_TYPE), default: "SPECIALTY", helper: "리리코스 지사는 개인·본사 분담 금액이 다릅니다" },
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
      <ActionDialog open={Boolean(dialog)} {...(dialog || {})} onClose={() => setDialog(null)} />
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </Stack>
  );
}
