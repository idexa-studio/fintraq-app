import type { ProFeatureId } from '@/features/pro/pro-features';
import type { PlanPrice, ProPlan } from '@/features/pro/pro-plans';
import { IS_PREMIUM_OVERRIDE_ALLOWED } from '@/platform/purchases/dev-override';
import { NO_ENTITLEMENT, canBuy, entitlementFrom, isPro as isProAt, parseSaved, reconcile, strongerOf, toSaved } from '@/platform/purchases/entitlement';
import type { Entitlement } from '@/platform/purchases/entitlement';
import { connectStore, fetchOwnedPurchases, fetchStorePlans, requestStorePlan, watchPurchases } from '@/platform/purchases/store';
import type { StorePlan } from '@/platform/purchases/store';
import { Analytics } from '@/platform/telemetry';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import { LoggerService } from '@/shared/logging/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as IAP from 'expo-iap';
import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

/** Whether the store's prices are known: asked for, here, or not to be had (offline, or no store on this phone). */
export type PriceState = 'loading' | 'ready' | 'unavailable';
/** How an attempt to buy ended. `unavailable`: the plan was not on sale, so the sheet never opened. */
export type BuyOutcome = 'paid' | 'pending' | 'cancelled' | 'failed' | 'unavailable';
export type RestoreOutcome = 'restored' | 'none' | 'failed';

type ProState = {
  /** Whether Pro is unlocked. False until the saved state has been read. */
  isPro: boolean;
  /** The saved state has been read, so `isPro` can be trusted. A screen that is Pro as a whole waits for this. */
  ready: boolean;
  /** What was paid for. With the developer override on, `isPro` can differ from it. */
  entitlement: Entitlement;
  prices: Partial<Record<ProPlan, PlanPrice>>;
  priceState: PriceState;
  /** Asks the store for the prices again, after a failure. */
  loadPrices: () => Promise<void>;
  buy: (plan: ProPlan) => Promise<BuyOutcome>;
  restore: () => Promise<RestoreOutcome>;
  /** Pro was there and the store no longer has it (a refund, or a subscription that ended). Shown once, then dismissed. */
  ended: boolean;
  dismissEnded: () => void;
};

const NOT_READY: ProState = {
  isPro: false, ready: false, entitlement: NO_ENTITLEMENT, prices: {}, priceState: 'loading',
  loadPrices: async () => undefined, buy: async () => 'unavailable', restore: async () => 'failed', ended: false, dismissEnded: () => undefined,
};

const ProContext = createContext<ProState>(NOT_READY);

type Override = 'FORCED_ON' | 'FORCED_OFF' | 'DEFAULT';

/**
 * Who is Pro, and the way to become it. The answer is read first from what is saved on the phone,
 * so it is right at once and offline; the store is then asked what this account owns and the two
 * are brought in line. Buying and restoring go through here and nowhere else.
 */
export function ProProvider({ children }: { children: React.ReactNode }) {
  const [entitlement, setEntitlement] = useState<Entitlement>(NO_ENTITLEMENT);
  const [override, setOverride] = useState<Override>('DEFAULT');
  const [ready, setReady] = useState(false);
  const [plans, setPlans] = useState<StorePlan[]>([]);
  const [priceState, setPriceState] = useState<PriceState>('loading');
  const [ended, setEnded] = useState(false);
  // The clock is read into state so that a subscription running out while the app is open is noticed.
  const [now, setNow] = useState(() => Date.now());

  const held = useRef<Entitlement>(NO_ENTITLEMENT);
  /** Whoever is waiting for the purchase sheet to close. */
  const waiting = useRef<((outcome: BuyOutcome) => void) | null>(null);

  const save = useCallback(async (next: Entitlement) => {
    held.current = next;
    setEntitlement(next);
    setNow(Date.now());
    await AsyncStorage.setItem(StorageKeys.PREMIUM, toSaved(next, Date.now())).catch((e) => LoggerService.error('PRO', 'The entitlement could not be saved', e));
  }, []);

  const settle = useCallback((outcome: BuyOutcome) => {
    waiting.current?.(outcome);
    waiting.current = null;
  }, []);

  /** Brings the saved state in line with what the store says. Left alone when the store cannot be asked. */
  const sync = useCallback(async () => {
    setNow(Date.now());
    try {
      const at = Date.now();
      const { entitlement: next, lost } = reconcile(held.current, entitlementFrom(await fetchOwnedPurchases(), at), at);
      if (JSON.stringify(next) !== JSON.stringify(held.current)) await save(next);
      if (lost) setEnded(true);
    } catch (e) {
      LoggerService.info('PRO', 'The store could not be asked; keeping what is saved', e);
    }
  }, [save]);

  const loadPrices = useCallback(async () => {
    setPriceState('loading');
    const found = (await connectStore()) ? await fetchStorePlans() : [];
    setPlans(found);
    setPriceState(found.length > 0 ? 'ready' : 'unavailable');
  }, []);

  useEffect(() => {
    let stopWatching: (() => void) | undefined;
    let gone = false;

    void (async () => {
      const [saved, savedOverride] = await AsyncStorage.multiGet([StorageKeys.PREMIUM, StorageKeys.PREMIUM_DEV_OVERRIDE]).catch(() => [[null, null], [null, null]] as const);
      if (gone) return;
      held.current = parseSaved(saved[1]);
      setEntitlement(held.current);
      if (IS_PREMIUM_OVERRIDE_ALLOWED && (savedOverride[1] === 'FORCED_ON' || savedOverride[1] === 'FORCED_OFF')) setOverride(savedOverride[1]);
      setReady(true);

      if (!(await connectStore()) || gone) {
        setPriceState('unavailable');
        return;
      }
      stopWatching = watchPurchases({
        onPaid: async (purchase) => {
          const at = Date.now();
          await save(strongerOf(held.current, entitlementFrom([purchase], at)));
          settle('paid');
        },
        onPending: () => settle('pending'),
        onCancelled: () => settle('cancelled'),
        onFailed: () => settle('failed'),
      });
      await Promise.all([loadPrices(), sync()]);
    })();

    // A subscription can renew or end, and a pending payment can clear, while the app is away.
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') void sync(); });
    return () => {
      gone = true;
      stopWatching?.();
      listener.remove();
    };
  }, [loadPrices, save, settle, sync]);

  const buy = useCallback((plan: ProPlan): Promise<BuyOutcome> => {
    const onSale = plans.find((candidate) => candidate.plan === plan);
    // The plans are never shown to someone who may not buy them; this holds even if a screen asked by mistake.
    if (!onSale || !canBuy(plan, held.current, Date.now())) return Promise.resolve('unavailable');
    Analytics.track('begin_checkout', { items: [{ item_id: onSale.productId, item_name: `Fintraq Pro (${plan})` }], value: onSale.amount, ...(onSale.currency ? { currency: onSale.currency } : {}) });
    return new Promise((resolve) => {
      waiting.current = resolve;
      // The outcome normally arrives through the purchase listeners; this catches a sheet that never opened.
      requestStorePlan(onSale).catch((e: { code?: string }) => {
        if (waiting.current === resolve) settle(e?.code === IAP.ErrorCode.UserCancelled ? 'cancelled' : 'failed');
      });
    });
  }, [plans, settle]);

  const restore = useCallback(async (): Promise<RestoreOutcome> => {
    try {
      const at = Date.now();
      const found = entitlementFrom(await fetchOwnedPurchases(), at);
      const outcome: RestoreOutcome = isProAt(found, at) ? 'restored' : 'none';
      if (outcome === 'restored') await save(found);
      Analytics.track('purchase_restore', { outcome });
      return outcome;
    } catch {
      Analytics.track('purchase_restore', { outcome: 'failed' });
      return 'failed';
    }
  }, [save]);

  const value = useMemo((): ProState => {
    const prices: Partial<Record<ProPlan, PlanPrice>> = {};
    for (const plan of plans) prices[plan.plan] = { display: plan.display, amount: plan.amount, regular: plan.regular, intro: plan.intro };
    const isPro = override === 'FORCED_ON' ? true : override === 'FORCED_OFF' ? false : isProAt(entitlement, now);
    return { isPro, ready, entitlement, prices, priceState, loadPrices, buy, restore, ended, dismissEnded: () => setEnded(false) };
  }, [entitlement, override, ready, plans, priceState, loadPrices, buy, restore, ended, now]);

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

/**
 * For a screen that has a limit or a Pro feature: whether Pro is unlocked, and the way to the
 * paywall. `requirePro` is for an action: it answers true for a Pro user, and otherwise opens the
 * paywall on that feature and answers false.
 */
export function usePro() {
  const { isPro, ready } = useContext(ProContext);
  const router = useRouter();
  const openPaywall = useCallback((feature?: ProFeatureId) => router.push(feature ? { pathname: '/pro', params: { feature } } : '/pro'), [router]);
  const requirePro = useCallback((feature: ProFeatureId): boolean => {
    if (!isPro) openPaywall(feature);
    return isPro;
  }, [isPro, openPaywall]);
  return { isPro, ready, openPaywall, requirePro };
}

/** Everything the paywall needs: what is held, what is on sale, and buying and restoring. */
export const useProStore = (): ProState => useContext(ProContext);
