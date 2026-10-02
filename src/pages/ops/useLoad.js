import { useCallback, useEffect, useState } from "react";

/** 여러 API를 한꺼번에 불러오고, reload로 다시 불러옵니다. */
export default function useLoad(loader, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setData(await loader());
      setError("");
    } catch (err) {
      setError(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, reload };
}
