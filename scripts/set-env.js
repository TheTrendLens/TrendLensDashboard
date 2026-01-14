const fs = require('fs');
const path = require('path');

// Load environment variables from .env file if it exists
require('dotenv').config();

// Determine if we're in a production-like environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.CONTEXT === 'production' || process.env.CONTEXT === 'deploy-preview';

// Target file path
const targetPath = path.join(__dirname, '../src/environments/environment.ts');

// Environment file content template
const envConfigFile = `
import {enableProdMode} from "@angular/core";

if (${isProduction}) {
  enableProdMode();
}

export const environment = {
  production: ${isProduction},
  backend: {
    baseURL: "${process.env.BACKEND_URL}"
  },
  addonsEnabled: ${process.env.ADDONS_ENABLED === 'true'},
  firebaseConfig: {
    apiKey: "${process.env.FIREBASE_API_KEY}",
    authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
    projectId: "${process.env.FIREBASE_PROJECT_ID}",
    storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET}",
    messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
    appId: "${process.env.FIREBASE_APP_ID}",
    measurementId: "${process.env.FIREBASE_MEASUREMENT_ID}"
  },
  STRIPE_KEY: "${process.env.STRIPE_KEY}",
  STRIPE_PRICING_TABLE_ID: "${process.env.STRIPE_PRICING_TABLE_ID}"
};
`;

console.log('Generating environment file...');

// Validate critical variables
const criticalVars = [
  'BACKEND_URL',
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'STRIPE_KEY'
];

criticalVars.forEach(varName => {
  if (!process.env[varName]) {
    console.warn(`WARNING: Environment variable ${varName} is missing!`);
  }
});

// Ensure the directory exists
const dir = path.dirname(targetPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Write the file
fs.writeFileSync(targetPath, envConfigFile);

console.log(`Environment file generated at ${targetPath}`);
