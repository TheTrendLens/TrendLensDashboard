import {enableProdMode} from "@angular/core";

enableProdMode();

export const environment = {
  production: true,
  backend: {
    baseURL: "https://api.thetrendlens.co.uk"
  },
  // Feature flags
  addonsEnabled: false,
  firebaseConfig: {
    apiKey: "AIzaSyCKU_ApBLpjipMqNPfokCDy0guCHs0cgfI",
    authDomain: "trendlens-production.firebaseapp.com",
    projectId: "trendlens-production",
    storageBucket: "trendlens-production.firebasestorage.app",
    messagingSenderId: "667382514364",
    appId: "1:667382514364:web:3340acc3cfe21e4e9f46b9",
    measurementId: "G-S75KHQD68D"
  },
  STRIPE_KEY: 'pk_live_51P6WfHKU9ihQF2dql4dH6JePeqhckghCrmTxLmDyfCgL1sNpW71EZ4c2Q3YFJWWJ0bkinLTxGFktANVmRYLGB5zM00WsdPJ0bb',
  STRIPE_PRICING_TABLE_ID: 'prctbl_1RlSytKU9ihQF2dqdHFwND88',
}
