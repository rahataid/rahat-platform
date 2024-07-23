import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@rumsan/prisma';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const prisma = new PrismaService();
const prismaClient = new PrismaClient();

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const projectStats = (uuid: string, url: string) => {
  if (!uuid) {
    return {
      "dataSources": {
        "source2": {
          "type": "url",
          "args": {
            "url": `${url}/v1/beneficiaries/stats`
          },
          "data": []
        }
      },
      "ui": [
        [
          {
            "title": "Gender",
            "type": "pie",
            "props": {},
            "dataSrc": "source2",
            "dataMap": `BENEFICIARY_GENDER`,
            "colSpan": 1,
            "rowSpan": 2
          }
        ],
        [
          {
            "title": "Beneficiary Internet Status",
            "type": "pie",
            "props": {},
            "dataSrc": "source2",
            "dataMap": `BENEFICIARY_INTERNETSTATUS`,
            "colSpan": 1,
            "rowSpan": 1
          }
        ],
        [
          {
            "title": "Beneficiary Internet Status",
            "type": "donut",
            "props": {},
            "dataSrc": "source2",
            "dataMap": `BENEFICIARY_INTERNETSTATUS`,
            "colSpan": 1,
            "rowSpan": 1
          }
        ]
      ]
    };
  }
  return {
    "dataSources": {
      "source2": {
        "type": "url",
        "args": {
          "url": `${url}/v1/projects/${uuid}/stats`
        },
        "data": []
      }
    },
    "ui": [
      [
        {
          "title": "Gender",
          "type": "pie",
          "props": {},
          "dataSrc": "source2",
          "dataMap": `BENEFICIARY_GENDER_ID_${uuid}`,
          "colSpan": 1,
          "rowSpan": 2
        },
        {
          "title": "Genders",
          "type": "bar",
          "props": {},
          "dataSrc": "source2",
          "dataMap": `BENEFICIARY_GENDER_ID_${uuid}`,
          "colSpan": 1,
          "rowSpan": 1
        }
      ],
      [
        {
          "title": "Beneficiary Internet Status",
          "type": "donut",
          "props": {},
          "dataSrc": "source2",
          "dataMap": `BENEFICIARY_INTERNETSTATUS_ID_${uuid}`,
          "colSpan": 1,
          "rowSpan": 1
        }
      ]
    ]
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
            group: `source_${projectUUID}`
          }
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
