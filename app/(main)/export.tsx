import { ExportScreen } from '@/src/features/export/screens/ExportScreen';
import { ProGateScreen } from '@/src/features/premium/screens/ProGateScreen';
import { usePremium } from '@/src/providers/PremiumProvider';

/** CSV export is Pro; the route itself is gated so a deep link can't reach it on the free plan. */
export default function ExportRoute() {
  const { isPremium } = usePremium();
  return isPremium ? <ExportScreen /> : <ProGateScreen feature="csv" />;
}
