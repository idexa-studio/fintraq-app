import { usePremium } from '@/src/providers/PremiumProvider';
import { PremiumScreen } from '@/src/features/premium/screens/PremiumScreen';
import { ProSuccessScreen } from '@/src/features/premium/screens/ProSuccessScreen';

export default function Screen() {
  const { isPremium } = usePremium();
  return isPremium ? <ProSuccessScreen /> : <PremiumScreen />;
}
