import { showsWhatsNew, withSeen } from '@/features/guide/guide-rules';
import type { TipId } from '@/features/guide/guide-rules';
import { addSeen, forgetTips, markWhatsNewSeen, readSeen, readWhatsNewSeen } from '@/features/guide/guide-store';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const SEEN_KEY = ['guide', 'seen'] as const;
const WHATS_NEW_KEY = ['guide', 'whats-new'] as const;
/** Home's own record that its first steps were hidden, cleared when the tips are brought back. */
const GETTING_STARTED_KEY = ['getting-started', 'dismissed'] as const;

/** What has been seen on this phone, and a way to add to it. Undefined until read. */
export function useSeen() {
  const queryClient = useQueryClient();
  const { data: seen } = useQuery({ queryKey: SEEN_KEY, queryFn: readSeen, staleTime: Infinity });
  const markSeen = (id: string) => {
    if (queryClient.getQueryData<string[]>(SEEN_KEY)?.includes(id)) return;
    queryClient.setQueryData<string[]>(SEEN_KEY, (now) => withSeen(now ?? [], id));
    void addSeen(id);
  };
  return { seen, markSeen };
}

/**
 * A tab's one-time tip. `ready` is whether the thing it talks about is on screen: a tip about
 * swiping a row says nothing over an empty list. Hidden until what was seen has been read, so it
 * never flashes at someone who closed it.
 */
export function useTip(id: TipId, ready: boolean) {
  const { seen, markSeen } = useSeen();
  return { visible: ready && seen !== undefined && !seen.includes(id), dismiss: () => markSeen(id) };
}

/** The note for someone arriving from an older version. */
export function useWhatsNew() {
  const queryClient = useQueryClient();
  const { data: visible = false } = useQuery({ queryKey: WHATS_NEW_KEY, queryFn: async () => showsWhatsNew(await readWhatsNewSeen()), staleTime: Infinity });
  const dismiss = () => {
    queryClient.setQueryData(WHATS_NEW_KEY, false);
    void markWhatsNewSeen();
  };
  return { visible, dismiss };
}

/** Settings' way to see the tips and Home's first steps again. */
export function useShowTipsAgain() {
  const queryClient = useQueryClient();
  return async () => {
    queryClient.setQueryData(SEEN_KEY, await forgetTips());
    queryClient.setQueryData(GETTING_STARTED_KEY, false);
  };
}
