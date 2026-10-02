const fs = require('fs');
const path = require('path');

const appName = 'rahat';

const packagePath = `dist/apps/${appName}/package.json`;

try {
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const rootPackageData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')
  );
  packageData.version = rootPackageData.version;

  // Modify package.json as needed
  packageData.scripts = {
    ...packageData.scripts,
    start: 'node main.js',
    [`studio:${appName}`]: 'prisma studio --schema prisma/schema.prisma',
    [`migrate:${appName}`]: `prisma migrate dev --name ${appName} --schema prisma/schema.prisma`,
    [`generate:${appName}`]: `prisma generate --schema prisma/schema.prisma`,
  };

  packageData.dependencies = {
    ...packageData.dependencies,
    prisma: '5.20.0',
    'ts-node': '^10.9.1',
    '@prisma/client': '5.20.0',
    dotenv: '16.4.5',
    readline: '1.3.0',
  };

  packageData.prisma = {
    seed: 'prisma/seed.ts',
  };

  // Write the updated package.json back to the file
  fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2), 'utf8');

  console.log('package.json updated successfully.');
} catch (err) {
  console.error('Error updating package.json:', err);
}
