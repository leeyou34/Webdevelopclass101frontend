import { useState } from "react";
import { Checkbox, IconButton, InputBase, ListItem, Tooltip } from "@mui/material";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";

/**
 * 할 일 한 줄. 글자를 누르면 고칠 수 있고, Enter 또는 바깥을 누르면 저장, Esc는 취소입니다.
 */
export default function TodoItem({ item, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title);

  function startEdit() {
    setDraft(item.title);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== item.title) onUpdate({ ...item, title: trimmed });
    else setDraft(item.title);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      setDraft(item.title);
      setEditing(false);
    }
  }

  return (
    <ListItem
      divider
      secondaryAction={
        <Tooltip title="삭제">
          <IconButton edge="end" aria-label={`"${item.title}" 삭제`} onClick={() => onDelete(item)}>
            <DeleteOutlined />
          </IconButton>
        </Tooltip>
      }
    >
      <Checkbox
        edge="start"
        checked={item.done}
        onChange={() => onUpdate({ ...item, done: !item.done })}
        slotProps={{ input: { "aria-label": `"${item.title}" 완료 표시` } }}
      />
      <InputBase
        value={editing ? draft : item.title}
        onChange={(e) => setDraft(e.target.value)}
        onClick={() => !editing && startEdit()}
        onBlur={() => editing && commit()}
        onKeyDown={handleKeyDown}
        readOnly={!editing}
        fullWidth
        slotProps={{ input: { maxLength: 200, "aria-label": "할 일 내용" } }}
        sx={{
          mr: 5,
          textDecoration: item.done && !editing ? "line-through" : "none",
          color: item.done && !editing ? "text.secondary" : "text.primary",
          cursor: editing ? "text" : "pointer",
        }}
      />
    </ListItem>
  );
}
