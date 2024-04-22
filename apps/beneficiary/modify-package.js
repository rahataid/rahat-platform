const fs = require('fs');
// Load the existing package.json
const appName = 'beneficiary';

const packagePath = `dist/apps/${appName}/package.json`;

try {
  // Read the package.json file as a JSON object
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

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
    prisma: '^5.1.0',
    'ts-node': '^10.9.1',
    '@prisma/client': '^5.1.0',
    '@nestjs-modules/mailer': '1.11.2',
    '@nestjs/bull': '10.1.0',
    '@nestjs/common': '10.3.3',
    '@nestjs/config': '3.2.0',
    '@nestjs/core': '10.3.8',
    '@nestjs/event-emitter': '2.0.4',
    '@nestjs/mapped-types': '2.0.5',
    '@nestjs/microservices': '10.3.8',
    '@nestjs/platform-express': '10.3.8',
    '@nestjs/swagger': '7.3.1',
    '@rumsan/extensions': '0.0.22',
    '@rumsan/prisma': '1.0.130',
    '@rumsan/sdk': '0.0.44',
    '@rumsan/settings': '0.0.108',
    abitype: '1.0.2',
    axios: '1.6.8',
    bull: '4.12.2',
    'class-transformer': '0.5.1',
    'class-validator': '0.14.1',
    'http-status-codes': '2.3.0',
    ioredis: '5.4.1',
    nodemailer: '6.9.13',
    'reflect-metadata': '0.1.14',
    rxjs: '7.8.1',
    uuid: '9.0.1',
    viem: '2.9.25',
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
