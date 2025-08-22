export const normKey = (s: string) => (s || '').toLowerCase().trim();

export const mergeNoDup = (base: string[], add: string[]) => {
  const seen = new Set(base.map(normKey));
  const toAppend = (add || []).filter(x => {
    const k = normKey(x);
    if (k && !seen.has(k)) { seen.add(k); return true; }
    return false;
  });
  return [...base, ...toAppend];
};

export const smartSet = (current: string[] = [], incoming: string[] = []) =>
  current.length === 0 ? incoming : mergeNoDup(current, incoming);
