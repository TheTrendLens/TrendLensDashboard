// This script determines which Angular configuration to use based on the Heroku app name
// If the app name contains "staging", it will use the development configuration
// Otherwise, it will use the production configuration

const { execSync } = require('child_process');

// Get the Heroku app name from the environment variable
const appName = process.env.HEROKU_APP_NAME || '';
console.log(`Heroku app name: ${appName}`);

// Determine which configuration to use
let configuration = 'production';
if (appName.includes('staging')) {
  console.log('Detected staging environment, using development configuration');
  configuration = 'development';
} else {
  console.log('Using production configuration');
}

// Run the Angular build command with the appropriate configuration
try {
  console.log(`Running: ng build --configuration ${configuration}`);
  execSync(`ng build --configuration ${configuration}`, { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
