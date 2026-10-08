/**
 * Where the paths of the shipped app (1.2.4 and earlier) lead now. Launcher
 * shortcuts people have pinned and notifications already scheduled still open
 * the old paths, so each keeps working as a redirect for as long as such an
 * install could exist.
 */

const KIND_OF_TYPE: Record<string, string> = { DR: 'expense', CR: 'income', TR: 'transfer' };

type Params = Record<string, string | undefined>;

const query = (params: Params) => {
  const pairs = Object.entries(params).filter((entry): entry is [string, string] => !!entry[1]);
  return pairs.length ? `?${pairs.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')}` : '';
};

/** `/transactions/create?type=DR|CR|TR&accountId=` */
export const addPathFromLegacy = ({ type, accountId }: Params): string => `/add${query({ kind: type ? KIND_OF_TYPE[type] : undefined, accountId })}`;

/** `/transactions/edit/<id>` */
export const editPathFromLegacy = (id: string | undefined): string => (id && /^\d+$/.test(id) ? `/transactions/${id}/edit` : '/');
