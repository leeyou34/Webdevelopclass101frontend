import { useCallback, useState } from "react";

/**
 * 동작 실행 도우미: 성공하면 메시지와 함께 다시 불러오고, 실패하면 서버의 오류 문구를 보여 줍니다.
 */
export default function useOps(reload) {
  const [notice, setNotice] = useState(null); // { severity, text }

  const run = useCallback(
    async (fn, successText) => {
      try {
        await fn();
        setNotice({ severity: "success", text: successText || "처리했습니다." });
        await reload?.();
        return true;
      } catch (err) {
        setNotice({ severity: "error", text: err.message });
        return false;
      }
    },
    [reload],
  );

  return { notice, setNotice, run };
}
