const fs = require('fs');
const appName = 'rahat';
const packagePath = `dist/apps/${appName}/package.json`;

try {
  const rootPackageData = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  packageData.scripts = {
    ...packageData.scripts,
    start: 'node main.js',
    [`studio:${appName}`]: 'prisma studio --schema prisma/schema.prisma',
    [`migrate:${appName}`]: `prisma migrate dev --name ${appName} --schema prisma/schema.prisma`,
    [`generate:${appName}`]: `prisma generate --schema prisma/schema.prisma`,
  };

  packageData.dependencies = {
    ...rootPackageData.dependencies,
    ...packageData.dependencies,
  };

  packageData.prisma = {
    seed: 'prisma/seed.ts',
  };

  fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2), 'utf8');
  console.log(`Merged ${Object.keys(packageData.dependencies).length} deps successfully.`);
} catch (err) {
  console.error('Error updating package.json:', err);
  process.exit(1);
}
