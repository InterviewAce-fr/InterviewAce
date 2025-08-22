import { useEffect, useRef } from 'react';
export function useDebouncedSave<T>(value: T, save: (v: T) => void, delay = 1000) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => save(value), delay);
    return () => { if (t.current) clearTimeout(t.current); };
  }, [value, save, delay]);
}
