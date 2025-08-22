import { useCallback } from 'react';
export function useArrayField(arr: string[] = [], onChange: (next: string[]) => void) {
  const add = useCallback(() => onChange([...(arr || []), '']), [arr, onChange]);
  const update = useCallback((i: number, v: string) => {
    const next = [...(arr || [])]; next[i] = v; onChange(next);
  }, [arr, onChange]);
  const remove = useCallback((i: number) => onChange((arr || []).filter((_, idx) => idx !== i)), [arr, onChange]);
  return { add, update, remove };
}
