export const environment = {
  production: false,
  backend: {
    baseURL: process.env['API_URL'] || "https://api.thetrendlens.co.uk"
  },
  firebaseConfig: {
    apiKey: process.env['FIREBASE_API_KEY'] || "AIzaSyAe4OWrwydmxI6pYtI0FpJv_ZXxtXUZ1-4",
    authDomain: process.env['FIREBASE_AUTH_DOMAIN'] || "trendlens-dev.firebaseapp.com",
    projectId: process.env['FIREBASE_PROJECT_ID'] || "trendlens-dev",
    storageBucket: process.env['FIREBASE_STORAGE_BUCKET'] || "trendlens-dev.appspot.com",
    messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID'] || "917406287028",
    appId: process.env['FIREBASE_APP_ID'] || "1:917406287028:web:a451a3e375d88fab2443e1",
    measurementId: process.env['FIREBASE_MEASUREMENT_ID'] || "G-Y6JM26S7CY"
  },
  STRIPE_KEY: process.env['STRIPE_KEY'] || 'pk_test_51P6WfHKU9ihQF2dqWPo0TLuAvBvWaLgO9PAX7xQq2vNKD9DYVLTUlfVIlWI4lmYiTcGezzg4mzK8ZdE2GqXKladz00UfoscPUm',
  STRIPE_PRICING_TABLE_ID: process.env['STRIPE_PRICING_TABLE_ID'] || 'prctbl_1PAZAfKU9ihQF2dqlWu8TUOb',
}
