import { IAPService, isSettledPurchase } from '@/platform/purchases/iap';
import type { StorePurchase } from '@/platform/purchases/entitlement';
import { planOfProduct } from '@/platform/purchases/entitlement';
import { PRODUCT_IDS } from '@/shared/contracts/product-ids';
import type { ProductKey } from '@/shared/contracts/product-ids';
import { formatCurrency } from '@/shared/format/money';
import { LoggerService } from '@/shared/logging/logger';
import * as IAP from 'expo-iap';
import { Platform } from 'react-native';

/**
 * The three plans as the store sells them, and the calls that buy, find and finish a purchase.
 * Everything that touches the store's SDK for Pro is here; what a purchase means is decided by
 * the rules in `entitlement.ts`, which never see the SDK.
 */

/** A price as the store states it. */
export type StorePrice = {
  /** As the store formats it, e.g. "₹299.00". */
  display: string;
  amount: number;
};

/** A plan on sale: what the store charges this user for it. */
export type StorePlan = StorePrice & {
  plan: ProductKey;
  productId: string;
  currency: string;
  /** The usual price of the one-time plan, while the store is selling it for less. */
  regular?: StorePrice;
  /** What a subscription costs to begin with, when the store opens it at less than its price ("Free" for a trial). */
  intro?: StorePrice;
  /** Google Play needs this to start a subscription or to buy at an offer's price; absent otherwise and on iOS. */
  offerToken?: string;
};

const OS = Platform.OS === 'ios' ? 'ios' : 'android';

export const productIdOf = (plan: ProductKey): string => PRODUCT_IDS[plan][OS];

const ALL_PRODUCT_IDS = (Object.keys(PRODUCT_IDS) as ProductKey[]).map(productIdOf);

type AndroidPhase = { formattedPrice: string; priceAmountMicros: string; priceCurrencyCode: string };
type AndroidOffer = { offerToken: string; pricingPhases?: { pricingPhaseList?: AndroidPhase[] } };
type AndroidOneTimeOffer = { offerToken: string; formattedPrice: string; priceAmountMicros: string; priceCurrencyCode: string; fullPriceMicros?: string | null };
type StoreProduct = {
  id: string;
  displayPrice?: string | null;
  price?: number | null;
  currency?: string | null;
  subscriptionOfferDetailsAndroid?: AndroidOffer[] | null;
  oneTimePurchaseOfferDetailsAndroid?: AndroidOneTimeOffer[] | null;
  introductoryPriceIOS?: string | null;
  introductoryPriceAsAmountIOS?: string | null;
};

const fromMicros = (micros: string): number => Number(micros) / 1_000_000;
const cheapest = <T,>(items: T[], cost: (item: T) => number): T | undefined =>
  items.reduce<T | undefined>((best, item) => (best === undefined || cost(item) < cost(best) ? item : best), undefined);

/**
 * One store product as a plan. Pure, for testing. Null when the product is not one of ours or
 * has no usable price.
 *
 * Google Play may hold several offers for a product; the buyer is given the cheapest it returns
 * (it returns only those this buyer may have). A subscription's price is the last phase of its
 * offer, and an earlier, cheaper phase is its opening price. A one-time product on offer states
 * its full price beside the price now.
 */
export function toStorePlan(product: StoreProduct): StorePlan | null {
  const plan = planOfProduct(product.id);
  if (!plan) return null;

  const offer = cheapest(product.subscriptionOfferDetailsAndroid ?? [], (o) => fromMicros(o.pricingPhases?.pricingPhaseList?.[0]?.priceAmountMicros ?? 'NaN') || 0);
  const phases = offer?.pricingPhases?.pricingPhaseList ?? [];
  const phase = phases.at(-1);
  const oneTime = phase ? undefined : cheapest(product.oneTimePurchaseOfferDetailsAndroid ?? [], (o) => fromMicros(o.priceAmountMicros));

  const display = phase?.formattedPrice ?? oneTime?.formattedPrice ?? product.displayPrice ?? '';
  const amount = phase ? fromMicros(phase.priceAmountMicros) : oneTime ? fromMicros(oneTime.priceAmountMicros) : (product.price ?? NaN);
  if (!display || !Number.isFinite(amount) || amount <= 0) return null;
  const currency = phase?.priceCurrencyCode ?? oneTime?.priceCurrencyCode ?? product.currency ?? '';

  const sold: StorePlan = { plan, productId: product.id, display, amount, currency, offerToken: offer?.offerToken ?? oneTime?.offerToken };

  const full = oneTime?.fullPriceMicros ? fromMicros(oneTime.fullPriceMicros) : NaN;
  if (full > amount) sold.regular = { display: formatCurrency(full, currency), amount: full };

  const opening = phases.length > 1 ? phases[0] : undefined;
  const iosOpening = product.introductoryPriceIOS ? Number(product.introductoryPriceAsAmountIOS) : NaN;
  if (opening && fromMicros(opening.priceAmountMicros) < amount) sold.intro = { display: opening.formattedPrice, amount: fromMicros(opening.priceAmountMicros) };
  else if (product.introductoryPriceIOS && iosOpening < amount) sold.intro = { display: product.introductoryPriceIOS, amount: iosOpening };

  return sold;
}

/** The plans on sale to this user. Empty when the store cannot be reached or sells none of them here. */
export async function fetchStorePlans(): Promise<StorePlan[]> {
  try {
    const products = await IAPService.run(() => IAP.fetchProducts({ skus: ALL_PRODUCT_IDS, type: 'all' }));
    return ((products ?? []) as unknown as StoreProduct[]).map(toStorePlan).filter((plan): plan is StorePlan => plan !== null);
  } catch (e) {
    LoggerService.warn('STORE', 'Plans could not be fetched', e);
    return [];
  }
}

/** Opens the store's purchase sheet. The outcome arrives through `watchPurchases`, not from here. */
export async function requestStorePlan(plan: StorePlan): Promise<void> {
  await IAPService.run(async () => {
    if (plan.plan === 'lifetime') {
      await IAP.requestPurchase({ type: 'in-app', request: { apple: { sku: plan.productId }, google: { skus: [plan.productId], offerToken: plan.offerToken } } });
    } else {
      await IAP.requestPurchase({
        type: 'subs',
        request: {
          apple: { sku: plan.productId },
          google: { skus: [plan.productId], subscriptionOffers: plan.offerToken ? [{ sku: plan.productId, offerToken: plan.offerToken }] : [] },
        },
      });
    }
  });
}

type RawPurchase = { productId: string; purchaseState?: string; transactionDate?: number | null; isAutoRenewing?: boolean | null; autoRenewingAndroid?: boolean | null; expirationDateIOS?: number | null };

/** A purchase reduced to what the entitlement rules need. Pure, for testing. */
export function toStorePurchase(purchase: RawPurchase): StorePurchase {
  return {
    productId: purchase.productId,
    pending: purchase.purchaseState === 'pending',
    purchasedAt: purchase.transactionDate ?? 0,
    renews: purchase.isAutoRenewing ?? purchase.autoRenewingAndroid ?? false,
    expiresAt: purchase.expirationDateIOS ?? null,
  };
}

/** Everything this store account owns of ours, pending purchases included (the rules skip them). */
export async function fetchOwnedPurchases(): Promise<StorePurchase[]> {
  const owned = await IAPService.run(() => IAP.getAvailablePurchases());
  return ((owned ?? []) as unknown as RawPurchase[]).map(toStorePurchase);
}

export type PurchaseEvents = {
  /** Paid for. Called before the purchase is finished with the store. */
  onPaid: (purchase: StorePurchase) => Promise<void> | void;
  /** Started but not paid yet (cash, bank transfer, a parent's approval). It grants nothing and is never finished. */
  onPending: () => void;
  onCancelled: () => void;
  onFailed: (error: unknown) => void;
};

/** Listens for purchases as the store reports them. Returns the way to stop. */
export function watchPurchases(events: PurchaseEvents): () => void {
  const updates = IAP.purchaseUpdatedListener(async (purchase) => {
    if (!purchase.productId || !planOfProduct(purchase.productId)) return;
    if (!isSettledPurchase(purchase)) {
      events.onPending();
      return;
    }
    try {
      await events.onPaid(toStorePurchase(purchase as unknown as RawPurchase));
      // Finished only once it has been recorded: an unfinished purchase is refunded by the store after three days.
      await IAP.finishTransaction({ purchase, isConsumable: false });
    } catch (e) {
      LoggerService.error('STORE', 'A paid purchase could not be recorded or finished', e);
      events.onFailed(e);
    }
  });
  const errors = IAP.purchaseErrorListener((error) => {
    if (error.code === IAP.ErrorCode.UserCancelled) events.onCancelled();
    else {
      LoggerService.error('STORE', 'The store reported a purchase error', error);
      events.onFailed(error);
    }
  });
  return () => {
    updates.remove();
    errors.remove();
  };
}

export const connectStore = (): Promise<boolean> => IAPService.init();

/** Opens the store's own page for managing or cancelling a subscription. */
export const openStoreSubscriptions = (): Promise<void> => IAPService.manage();
