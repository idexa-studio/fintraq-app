/**
 * The Developer screen's "Premium override" is a debugging aid. It is honoured in development
 * builds only: a release build ignores any stored override, so Pro can't be unlocked without a
 * store purchase.
 */
export const IS_PREMIUM_OVERRIDE_ALLOWED = __DEV__;
