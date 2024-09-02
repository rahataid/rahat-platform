import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@rumsan/prisma';

const prisma = new PrismaService();
const prismaClient = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:6cmL6UhwRL@206.189.141.44:7500/core?schema=public'
});

const projectStats = (url: string) => {
  return {
    "dataSources": {
      "source2": {
        "type": "url",
        "args": {
          "url": `${url}/v1/beneficiaries/stats`
        },
        "data": [] // Placeholder for actual data
      }
    },
    "ui": [
      [
        {
          "type": "dataCard",
          "props": {},
          "title": "Banked Beneficiaries",
          "colSpan": 1,
          "dataMap": `BENEFICIARY_BANKEDSTATUS.BANKED`,
          "dataSrc": "source2",
          "rowSpan": 1
        },
        {
          "type": "dataCard",
          "props": {},
          "title": "Total Females",
          "colSpan": 1,
          "dataMap": `BENEFICIARY_GENDER.FEMALE`,
          "dataSrc": "source2",
          "rowSpan": 1
        },
        {
          "type": "dataCard",
          "props": {},
          "title": "Unbanked Beneficiaries",
          "colSpan": 1,
          "dataMap": `BENEFICIARY_BANKEDSTATUS.BANKED`,
          "dataSrc": "source2",
          "rowSpan": 1
        }
      ],
      [
        {
          "type": "pie",
          "props": {},
          "title": "Internet Status",
          "colSpan": 1,
          "dataMap": `BENEFICIARY_INTERNETSTATUS`,
          "dataSrc": "source2",
          "rowSpan": 1
        },
        {
          "type": "pie",
          "props": {},
          "title": "Gender",
          "colSpan": 1,
          "dataMap": `BENEFICIARY_GENDER`,
          "dataSrc": "source2",
          "rowSpan": 1
        },
        {
          "type": "bar",
          "props": {},
          "title": "Phone Status",
          "colSpan": 1,
          "dataMap": `BENEFICIARY_PHONESTATUS`,
          "dataSrc": "source2",
          "rowSpan": 4
        }
      ]
    ]
  };
};

const main = async () => {
  const url = process.argv[2];
  if (!url) {
    console.error('Please provide a URL as a command-line argument.');
    process.exit(1);
  }

  try {
    await prismaClient.stats.create({
      data: {
        name: `DASHBOARD_SOURCE`,
        data: projectStats(url),
        group: `source`
      }
    });
    console.log('Stats created successfully');
  } catch (error) {
    console.error('Error creating stats:', error);
  } finally {
    await prisma.$disconnect();
  }
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
