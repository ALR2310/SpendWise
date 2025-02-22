const { exec } = require('child_process');
const fs = require('fs');

const packageJsonPath = './package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const { version, versionCode } = packageJson.version;

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

try {
  exec(`npx capacitor-set-version set:android -v ${version} -b ${versionCode}`);
  console.log('✅ Set version and build successfully!');
} catch (error) {
  console.error('❌ Error setting version and build!', error);
  process.exit(1);
}
