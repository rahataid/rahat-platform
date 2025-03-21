/**
 * unified-stats-script.ts
 *
 * A single script that uses Inquirer to prompt:
 *  - Base URL
 *  - Core vs. Project
 *  - (If Project) Project Type
 *  - (If Project) Project UUID
 *
 * Then creates stats with Prisma in your `stats` table.
 *
 * Usage:
 *   ts-node unified-stats-script.ts
 *
 * Make sure you have installed: npm i inquirer
 */

import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@rumsan/prisma'; // If you need it
import inquirer from 'inquirer';

// If you only need a single Prisma client:
const prismaClient = new PrismaClient();

/**
 * For a minimal approach, remove this and just use "prismaClient".
 * Or if you want the custom PrismaService from @rumsan/prisma,
 * keep it as well. They can both point to the same DB.
 */
const prismaService = new PrismaService();

/**
 * Build stats for "core" environment
 */
function buildCoreStats(baseUrl: string) {
  return {
    dataSources: {
      source2: {
        type: 'url',
        args: {
          // For core, we fetch stats from e.g. /v1/beneficiaries/stats
          url: `${baseUrl}/v1/beneficiaries/stats`,
        },
        data: [],
      },
    },
    ui: [
      {
        fields: [
          {
            type: 'dataCard',
            props: {},
            title: 'Total Beneficiaries',
            colSpan: 1,
            dataMap: 'BENEFICIARY_TOTAL',
            dataSrc: 'source2',
            rowSpan: 1,
            icon: 'UsersRound',
          },
        ],
      },
      {
        fields: [
          {
            type: 'donut',
            props: {},
            title: 'Total Beneficiaries',
            colSpan: 1,
            dataMap: 'BENEFICIARY_GENDER',
            dataSrc: 'source2',
            rowSpan: 1,
          },
          {
            type: 'donut',
            props: {},
            title: 'Household Phone Availability',
            colSpan: 1,
            dataMap: 'BENEFICIARY_PHONE_AVAILABILITY_STATS',
            dataSrc: 'source2',
            rowSpan: 1,
          },
          {
            type: 'donut',
            props: {},
            title: 'Household Bank Status',
            colSpan: 1,
            dataMap: 'BENEFICIARY_BANKEDSTATUS',
            dataSrc: 'source2',
            rowSpan: 1,
          },
        ],
      },
      {
        title: '',
        fields: [
          {
            type: 'donut',
            props: {},
            title: 'Type of Phone',
            colSpan: 1,
            dataMap: 'BENEFICIARY_PHONESTATUS',
            dataSrc: 'source2',
            rowSpan: 1,
          },
        ],
      },
      {
        title: 'Beneficiaries GPS Location',
        fields: [
          {
            type: 'map',
            props: {},
            title: '',
            colSpan: 3,
            dataMap: 'BENEFICIARY_MAP_STATS',
            dataSrc: 'source2',
            rowSpan: 1,
          },
        ],
      },
    ],
  };
}

/**
 * Build stats for "aa" environment (placeholder example).
 */
function buildAAStats(uuid: string, baseUrl: string) {
  return {
    dataSources: {
      mySource: {
        type: 'url',
        args: {
          url: `${baseUrl}/v1/projects/${uuid}/stats`,
        },
        data: [],
      },
    },
    ui: [
      {
        fields: [
          {
            type: 'dataCard',
            props: {},
            title: 'Total Something for AA',
            colSpan: 1,
            dataMap: `AA_TOTAL_ID_${uuid}`,
            dataSrc: 'mySource',
            rowSpan: 1,
            icon: 'UsersRound',
          },
        ],
      },
    ],
  };
}

/**
 * Build stats for "el-kenya" environment
 */
function buildElKenyaStats(uuid: string, baseUrl: string) {
  return {
    dataSources: {
      source2: {
        type: 'url',
        args: {
          url: `${baseUrl}/v1/projects/${uuid}/stats`,
        },
        data: [],
      },
      source3: {
        type: 'url',
        args: {
          url: `${baseUrl}/v1/projects/${uuid}/actions`,
          apiCallData: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'rpProject.reporting.list',
              payload: {},
            }),
          },
        },
        data: [],
      },
    },
    ui: [
      {
        fields: [
          {
            type: 'dataCard',
            props: {},
            title: 'Total Beneficiaries',
            colSpan: 1,
            dataMap: `BENEFICIARY_TOTAL_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
            icon: 'UsersRound',
          },
          {
            type: 'dataCard',
            props: {},
            title: 'Total Vision Centers/Hospitals',
            colSpan: 1,
            dataMap: `VENDOR_TOTAL_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
            icon: 'HousePlus',
          },
        ],
      },
      {
        fields: [
          {
            type: 'dataCard',
            props: {},
            title: 'Total Voucher Assigned',
            colSpan: 1,
            dataMap: `TOTAL_VOUCHER_ASSIGNED_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
            icon: 'Ticket',
          },
          {
            type: 'dataCard',
            props: {},
            title: 'Total Beneficiary Vouchers Redeemed',
            colSpan: 1,
            dataMap: `TOTAL_REDEMPTION_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
            icon: 'Ticket',
          },
          {
            type: 'dataCard',
            props: {},
            title: 'Total Vendor Vouchers Claimed',
            colSpan: 1,
            dataMap: `TOTAL_APPROVED_REIMBURSEMENT_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
            icon: 'Ticket',
          },
        ],
      },
      {
        fields: [
          {
            type: 'donut',
            props: {},
            title: 'Total Beneficiaries',
            colSpan: 1,
            dataMap: `BENEFICIARY_TYPE_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
          {
            type: 'donut',
            props: {},
            title: 'Total Vouchers',
            colSpan: 1,
            dataMap: `TOTAL_VOUCHER_REDEEM_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
          {
            type: 'donut',
            props: {},
            title: 'Total Redeemed Vouchers',
            colSpan: 1,
            dataMap: `REDEMPTION_STATS_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
          {
            type: 'donut',
            props: {},
            title: 'Total Reimbursement',
            colSpan: 1,
            dataMap: `REIMBURSEMENT_STATS_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
        ],
      },
      {
        fields: [
          {
            type: 'line',
            props: {},
            title: 'No. of Redemptions/per week',
            colSpan: 1,
            dataMap: '',
            dataSrc: 'source2',
            rowSpan: 1,
          },
        ],
      },
    ],
  };
}

/**
 * Build stats for "sms-voucher" environment
 */
function buildSMSVoucherStats(uuid: string, baseUrl: string) {
  return {
    dataSources: {
      source2: {
        type: 'url',
        args: {
          url: `${baseUrl}/v1/projects/${uuid}/stats`,
        },
        data: [],
      },
      source3: {
        type: 'url',
        args: {
          url: `${baseUrl}/v1/projects/${uuid}/actions`,
          apiCallData: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'rpProject.reporting.list',
              payload: {},
            }),
          },
        },
        data: [],
      },
    },
    ui: [
      {
        fields: [
          {
            icon: 'UsersRound',
            type: 'dataCard',
            props: {},
            title: 'Total Consumers',
            colSpan: 1,
            dataMap: `BENEFICIARY_TOTAL_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
          {
            icon: 'HousePlus',
            type: 'dataCard',
            props: {},
            title: 'Total Vendors',
            colSpan: 1,
            dataMap: `VENDOR_TOTAL_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
          {
            icon: 'User-Round-X',
            type: 'dataCard',
            props: {},
            title: 'Total Inactive Consumers',
            colSpan: 1,
            dataMap: `NOT_REDEEM_STATS_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
        ],
      },
      {
        fields: [
          {
            type: 'donut',
            props: {},
            title: 'Consumer Gender',
            colSpan: 1,
            dataMap: `BENEFICIARY_GENDER_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
          {
            type: 'donut',
            props: {},
            title: 'Voucher Usage Type',
            colSpan: 1,
            dataMap: `VOUCHER_USAGE_TYPE_STATS_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
          {
            type: 'donut',
            props: {},
            title: 'Glass Purchase Type',
            colSpan: 1,
            dataMap: `REDEMPTION_STATS_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
          {
            type: 'donut',
            props: {},
            title: 'Consent Provided',
            colSpan: 1,
            dataMap: `CONSENT_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
        ],
      },
      {
        fields: [
          {
            type: 'bar',
            props: {
              horizontal: false,
              xaxisLabels: true,
            },
            title: 'Consumer Age Group',
            colSpan: 4,
            dataMap: `BENEFICIARY_AGE_RANGE_ID_${uuid}`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
        ],
      },
    ],
  };
}

/**
 * All project stats builder functions in one record,
 * mapped by the "project type" name
 */
const projectStatsBuilders: Record<
  string,
  (uuid: string, baseUrl: string) => any
> = {
  aa: buildAAStats,
  'el-kenya': buildElKenyaStats,
  'sms-voucher': buildSMSVoucherStats,
  // Add more if you have them
};

/**
 * Main script
 */
async function main() {
  try {
    // Step A: ask for base URL
    const { baseUrl } = await inquirer.prompt([
      {
        type: 'input',
        name: 'baseUrl',
        message: 'Enter base URL (without /v1):',
        validate: (input: string) =>
          !!input || 'Please provide a valid base URL.',
      },
    ]);

    // Step B: ask if "core" or "project"
    const { environment } = await inquirer.prompt([
      {
        type: 'list',
        name: 'environment',
        message: 'Select environment type:',
        choices: ['core', 'project'],
      },
    ]);

    if (environment === 'core') {
      // Build the core stats
      const data = buildCoreStats(baseUrl);
      await prismaClient.stats.create({
        data: {
          name: 'DASHBOARD_SOURCE',
          data,
          group: 'source',
        },
      });
      console.log('Successfully created Core stats in `stats` table.');
    } else {
      // environment === 'project'
      // Step C: ask which project type
      const projectTypes = Object.keys(projectStatsBuilders); // e.g. ["aa","el-kenya","sms-voucher"]
      const { selectedType } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedType',
          message: 'Select a project type:',
          choices: projectTypes,
        },
      ]);

      // Step D: ask for project UUID
      const { projectUUID } = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectUUID',
          message: 'Enter project UUID:',
          validate: (input: string) =>
            !!input || 'Please provide a valid project UUID.',
        },
      ]);

      const builderFn = projectStatsBuilders[selectedType];
      const data = builderFn(projectUUID, baseUrl);

      // Insert
      await prismaClient.stats.create({
        data: {
          name: `DASHBOARD_SOURCE_${projectUUID}`,
          data,
          group: `source_${projectUUID}`,
        },
      });
      console.log(
        `Successfully created ${selectedType} stats for project UUID ${projectUUID}.`
      );
    }

    // done
  } catch (error) {
    console.error('Error during script:', error);
  } finally {
    await prismaClient.$disconnect();
  }
}

// Run
main().catch((err) => {
  console.error('Main error:', err);
  process.exit(1);
});
