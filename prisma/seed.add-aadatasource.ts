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


const projectStats = (url: string) => {
  return {
    dataSources: {
      source2: {
        type: 'url',
        args: {
          url: `${url}/v1/beneficiaries/stats`,
        },
        data: [], // Placeholder for actual data
      },
    },
    ui: [
      // {
      //   title: 'Aid Distribution Summary',
      //   fields: [
      //     {
      //       type: 'dataCard',
      //       props: {},
      //       title: 'Households receiving cash support',
      //       colSpan: 1,
      //       dataMap: ``,
      //       dataSrc: 'source2',
      //       rowSpan: 1,
      //       icon: 'Home',
      //     },
      //     {
      //       type: 'dataCard',
      //       props: {},
      //       title: 'Total Fund Distributed',
      //       colSpan: 1,
      //       dataMap: ``,
      //       dataSrc: 'source2',
      //       rowSpan: 1,
      //       icon: 'HandCoins',
      //     },
      //     {},
      //   ],
      // },
      {
        title: 'Beneficiaries Summary',
        fields: [
          {
            type: 'donut',
            props: {},
            title: 'Total Beneficiaries',
            colSpan: 1,
            dataMap: `BENEFICIARY_GENDER`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
          {
            type: 'pie',
            props: {},
            title: 'Household by Caste',
            colSpan: 1,
            dataMap: `BENEFICIARY_CASTE_COUNT_STATS`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
          {
            type: 'bar',
            props: { horizontal: true, xaxisLabels: false },
            title: 'Vulnerability Status',
            colSpan: 1,
            dataMap: `BENEFICIARY_VULNERABILITY_COUNT_STATS`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
        ],
      },
      {
        title: '',
        fields: [
          {
            type: 'pie',
            props: {},
            title: 'Household Phone Availability',
            colSpan: 1,
            dataMap: `BENEFICIARY_PHONE_AVAILABILITY_STATS`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
          {
            type: 'pie',
            props: {},
            title: 'Household Bank Status',
            colSpan: 1,
            dataMap: `BENEFICIARY_BANKEDSTATUS_NEW`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
          {
            type: 'pie',
            props: {},
            title: 'Type of Phone',
            colSpan: 1,
            dataMap: `BENEFICIARY_PHONE_TYPE_STATS`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
        ],
      },
      // {
      //   title: 'Early Warning Communication Summary',
      //   fields: [
      //     {
      //       type: 'dataCard',
      //       props: {},
      //       title: 'Text Based Alert',
      //       colSpan: 1,
      //       dataMap: ``,
      //       dataSrc: 'source2',
      //       rowSpan: 1,
      //       icon: 'MessageSquare',
      //     },
      //     {
      //       type: 'dataCard',
      //       props: {},
      //       title: 'Voice Based Alert',
      //       colSpan: 1,
      //       dataMap: ``,
      //       dataSrc: 'source2',
      //       rowSpan: 1,
      //       icon: 'AudioLines',
      //     },
      //     {
      //       type: 'dataCard',
      //       props: {},
      //       title: 'Total SMS sent to Beneficiaries',
      //       colSpan: 1,
      //       dataMap: ``,
      //       dataSrc: 'source2',
      //       rowSpan: 1,
      //       icon: 'MessageSquare',
      //     },
      //     {
      //       type: 'dataCard',
      //       props: {},
      //       title: 'Total IVR sent to Beneficiaries',
      //       colSpan: 1,
      //       dataMap: ``,
      //       dataSrc: 'source2',
      //       rowSpan: 1,
      //       icon: 'AudioLines',
      //     },
      //   ],
      // },
      {
        title: 'Beneficiaries GPS Location',
        fields: [
          {
            type: 'map',
            props: {},
            title: '',
            colSpan: 3,
            dataMap: `BENEFICIARY_MAP_STATS`,
            dataSrc: 'source2',
            rowSpan: 1,
          },
        ],
      },
    ],
  };
};

const main = async () => {
  rl.question('Enter URL: ', async (url) => {
    try {
      await prismaClient.stats.create({
        data: {
          name: `AA_DASHBOARD_SOURCE`,
          data: projectStats(url),
          group: `source`,
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
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
