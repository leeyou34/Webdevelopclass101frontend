import { Chip } from "@mui/material";

/** labels.js의 [이름, 색] 쌍으로 상태 칩을 그립니다. */
export default function StatusChip({ map, value }) {
  const [label, color] = map[value] || [value, "default"];
  return <Chip size="small" label={label} color={color} variant={color === "default" ? "outlined" : "filled"} />;
}
