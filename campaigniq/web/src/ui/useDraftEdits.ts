import { useEffect, useMemo, useState } from 'react';

export function useDraftEdits<T>(baseline: T) {
  const [draft, setDraft] = useState(baseline);
  useEffect(() => setDraft(baseline), [baseline]);
  const hasChanges = useMemo(() => JSON.stringify(draft) !== JSON.stringify(baseline), [draft, baseline]);
  return { draft, setDraft, hasChanges, discard: () => setDraft(baseline) };
}
