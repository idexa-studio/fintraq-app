const { withEntitlementsPlist } = require('@expo/config-plugins');

// expo-notifications asks for the push entitlement (aps-environment) on every
// build. Fintraq's reminders are local notifications: nothing registers for
// remote push, so the entitlement is not needed. It is also the one thing a
// free Apple account ("Personal Team") cannot sign, so with it the app could
// not be run on a phone without a paid developer account.
module.exports = function withNoPushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    return config;
  });
};
