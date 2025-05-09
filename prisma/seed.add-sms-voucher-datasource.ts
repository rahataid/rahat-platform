

import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@rumsan/prisma';
import * as readline from 'readline';

const prisma = new PrismaService();
const prismaClient = new PrismaClient();

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const projectStats = (uuid: string, url: string) => {
  return {
    dataSources: {
      source2: {
        type: 'url',
        args: {
          url: `${url}/v1/projects/${uuid}/stats`,
        },
        data: [], // Placeholder for actual data
      },
      source3: {
        type: 'url',
        args: {
          url: `${url}/v1/projects/${uuid}/actions`,
          apiCallData: {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'rpProject.reporting.list',
              payload: {},
            }),
          },
        },
        data: [], // Placeholder for actual data
      },
    },
    ui: [
      {
        "fields": [
          {
            "icon": "UsersRound",
            "type": "dataCard",
            "props": {},
            "title": "Total Consumers",
            "colSpan": 1,
            "dataMap": `BENEFICIARY_TOTAL_ID_${uuid}`,
            "dataSrc": "source2",
            "rowSpan": 1
          },
          {
            "icon": "HousePlus",
            "type": "dataCard",
            "props": {},
            "title": "Total Vendors",
            "colSpan": 1,
            "dataMap": `VENDOR_TOTAL_ID_${uuid}`,
            "dataSrc": "source2",
            "rowSpan": 1
          },
          {
            "icon": "User-Round-X",
            "type": "dataCard",
            "props": {},
            "title": "Total Inactive Consumers",
            "colSpan": 1,
            "dataMap": `NOT_REDEEM_STATS_ID_${uuid}`,
            "dataSrc": "source2",
            "rowSpan": 1
          }
        ]
      },
      {
        "fields": [
          {
            "type": "donut",
            "props": {},
            "title": "Consumer Gender",
            "colSpan": 1,
            "dataMap": `BENEFICIARY_GENDER_ID_${uuid}`,
            "dataSrc": "source2",
            "rowSpan": 1
          },
          {
            "type": "donut",
            "props": {},
            "title": "Voucher Usage Type",
            "colSpan": 1,
            "dataMap": `VOUCHER_USAGE_TYPE_STATS_ID_${uuid}`,
            "dataSrc": "source2",
            "rowSpan": 1
          },
          {
            "type": "donut",
            "props": {},
            "title": "Glass Purchase Type",
            "colSpan": 1,
            "dataMap": `REDEMPTION_STATS_ID_${uuid}`,
            "dataSrc": "source2",
            "rowSpan": 1
          },
          {
            "type": "donut",
            "props": {},
            "title": "Consent Provided",
            "colSpan": 1,
            "dataMap": `CONSENT_ID_${uuid}`,
            "dataSrc": "source2",
            "rowSpan": 1
          }
        ]
      },
      {
        "fields": [
          {
            "type": "bar",
            "props": {
              "horizontal": false,
              "xaxisLabels": true
            },
            "title": "Consumer Age Group",
            "colSpan": 4,
            "dataMap": `BENEFICIARY_AGE_RANGE_ID_${uuid}`,
            "dataSrc": "source2",
            "rowSpan": 1
          }
        ]
      }
    ],
  };
};



const main = async () => {
  rl.question('Enter project UUID: ', (projectUUID) => {
    rl.question('Enter URL: ', async (url) => {
      try {
        await prismaClient.stats.create({
          data: {
            name: `DASHBOARD_SOURCE_${projectUUID}`,
            data: projectStats(projectUUID, url),
            group: `source_${projectUUID}`,
          },
        });
        console.log('Stats created successfully');
      } catch (error) {
        console.error('Error creating stats:', error);
      } finally {
        rl.close();
        await prisma.$disconnect();
      }
    });
  });
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
