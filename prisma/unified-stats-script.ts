/**
 * unified-stats-script.ts
 *
 * Usage:
 *   ts-node unified-stats-script.ts
 *
 * Make sure you have in your package.json dependencies:
 *   "@prisma/client": "^some_version",
 *   "inquirer": "^some_version"
 *
 * Also ensure you have TypeScript >=4.7 if using "assert { type: 'json' }" ESM imports:
 *   "module": "NodeNext" or "nodenext" in your tsconfig
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
// Load environment variables from .env file
dotenv.config();

const aaConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'stats-configs', 'aa.json'), 'utf-8')
);
const coreConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'stats-configs', 'core.json'), 'utf-8')
);
const elKenyaConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'stats-configs', 'el-kenya.json'), 'utf-8')
);
const elCambodiaConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'stats-configs', 'el-cambodia.json'), 'utf-8')
);
const smsVoucherConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'stats-configs', 'sms-voucher.json'), 'utf-8')
);




// or if using node 16 or commonjs, do require() or readFile + JSON.parse
// e.g. const coreConfig = require('./stats-configs/core.json');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// A record to map "aa", "el-kenya", "sms-voucher" => their raw JSON
const projectConfigMap: Record<string, any> = {
  'aa': aaConfig,
  'el-kenya': elKenyaConfig,
  'sms-voucher': smsVoucherConfig,
  'el-cambodia': elCambodiaConfig,
};

/**
 * For "core" environment, we use the loaded `coreConfig`,
 * and set the single dataSource URL to baseUrl + '/v1/beneficiaries/stats'
 */
function buildCoreStats(baseUrl: string) {
  // clone the JSON so we don't mutate the original
  const finalCore = JSON.parse(JSON.stringify(coreConfig));

  // fill in the URL
  if (finalCore.dataSources.source2) {
    finalCore.dataSources.source2.args.url = `${baseUrl}/v1/beneficiaries/stats`;
  }

  return finalCore;
}

/**
 * For "project" environment, we take the chosen type (aa, el-kenya, etc.),
 * clone its config, fill in the data source URLs, and do a string replacement for __uuid
 */
function buildProjectStats(
  projectType: string,
  projectUUID: string,
  baseUrl: string
) {
  // clone
  const configObj = JSON.parse(JSON.stringify(projectConfigMap[projectType]));

  // fill in dataSource(s)
  if (configObj.dataSources.source2) {
    configObj.dataSources.source2.args.url = `${baseUrl}/v1/projects/${projectUUID}/stats`;
  }
  if (configObj.dataSources.source3) {
    configObj.dataSources.source3.args.url = `${baseUrl}/v1/projects/${projectUUID}/actions`;
  }

  // recursively fix dataMaps that contain __uuid
  for (const section of configObj.ui) {
    for (const field of section.fields) {
      if (typeof field.dataMap === 'string' && field.dataMap.includes('__uuid')) {
        field.dataMap = field.dataMap.replace('__uuid', `_${projectUUID}`);
      }
      // If needed, also do for "title" or other properties
      if (typeof field.title === 'string' && field.title.includes('__uuid')) {
        field.title = field.title.replace('__uuid', `_${projectUUID}`);
      }
    }
  }

  return configObj;
}

async function main() {
  try {
    // Step 1: ask for baseUrl
    const { baseUrl } = await inquirer.prompt([
      {
        type: 'input',
        name: 'baseUrl',
        message: 'Enter base URL (without /v1):',
        validate: (val) => !!val || 'Please provide a base URL',
      },
    ]);

    // Step 2: ask if "core" or "project"
    const { environment } = await inquirer.prompt([
      {
        type: 'list',
        name: 'environment',
        message: 'Select environment type:',
        choices: ['core', 'project'],
      },
    ]);

    if (environment === 'core') {
      // Build final object
      const data = buildCoreStats(baseUrl);

      // Insert
      await prisma.stats.create({
        data: {
          name: 'DASHBOARD_SOURCE', // or any naming convention for core
          data,
          group: 'source',
        },
      });

      console.log('Core stats created successfully!');

    } else {
      // environment === 'project'
      // Step 3: pick which project type
      const { selectedType } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedType',
          message: 'Select project type:',
          choices: Object.keys(projectConfigMap),
        },
      ]);

      // Step 4: user enters project UUID
      const { projectUUID } = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectUUID',
          message: 'Enter project UUID:',
          validate: (val) => !!val || 'Please enter a project UUID',
        },
      ]);

      // Build final object
      const data = buildProjectStats(selectedType, projectUUID, baseUrl);

      // Insert
      await prisma.stats.create({
        data: {
          name: `DASHBOARD_SOURCE_${projectUUID}`,
          data,
          group: `source_${projectUUID}`,
        },
      });

      console.log(
        `Project stats for "${selectedType}" with UUID "${projectUUID}" created successfully!`
      );
    }

  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
main().catch((err) => {
  console.error('Main catch error:', err);
  process.exit(1);
});
