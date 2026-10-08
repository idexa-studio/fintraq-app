import { fetchRemoteAppConfig } from '@/platform/config/remote-config';
import { useQuery } from '@tanstack/react-query';

/** Where the privacy policy and the terms live. Empty until known, so their rows wait rather than open nothing. */
export function useLegalLinks(): { privacyUrl: string; termsUrl: string } {
  const { data } = useQuery({ queryKey: ['app-config', 'legal'], queryFn: fetchRemoteAppConfig, staleTime: Infinity, retry: 1 });
  return { privacyUrl: data?.privacyUrl ?? '', termsUrl: data?.termsUrl ?? '' };
}
