import {enableProdMode} from "@angular/core";

enableProdMode();

export const environment = {
  production: true,
  backend: {
    baseURL: "https://dev.thetrendlens.co.uk"
  },
  firebaseConfig: {
    apiKey: "AIzaSyAe4OWrwydmxI6pYtI0FpJv_ZXxtXUZ1-4",
    authDomain: "trendlens-dev.firebaseapp.com",
    projectId: "trendlens-dev",
    storageBucket: "trendlens-dev.appspot.com",
    messagingSenderId: "917406287028",
    appId: "1:917406287028:web:a451a3e375d88fab2443e1",
    measurementId: "G-Y6JM26S7CY"
  },
  STRIPE_KEY: 'pk_live_51P6WfHKU9ihQF2dql4dH6JePeqhckghCrmTxLmDyfCgL1sNpW71EZ4c2Q3YFJWWJ0bkinLTxGFktANVmRYLGB5zM00WsdPJ0bb',
  STRIPE_PRICING_TABLE_ID: 'prctbl_1RgrKSKU9ihQF2dqIU8c4akd',
}
