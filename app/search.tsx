import { ProGateScreen } from '@/src/features/premium/screens/ProGateScreen';
import { SearchScreen } from '@/src/features/search/screens/SearchScreen';
import { usePremium } from '@/src/providers/PremiumProvider';

export default function SearchRoute() {
  const { isPremium } = usePremium();
  return isPremium ? <SearchScreen /> : <ProGateScreen feature="search" />;
}
