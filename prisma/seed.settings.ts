import { Prisma, PrismaClient, Setting, SettingDataType } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  rl.question('Please enter SMTP_USER: ', (SMTP_USER) => {
    rl.question('Please enter SMTP_PASSWORD: ', (SMTP_PASSWORD) => {
      const settings: Setting[] = [
        {
          value: {
            HOST: 'smtp.gmail.com',
            PORT: 465,
            SECURE: true,
            USERNAME: SMTP_USER,
            PASSWORD: SMTP_PASSWORD,
          } as Prisma.JsonValue,
          isPrivate: true,
          isReadOnly: true,
          name: 'SMTP',
          requiredFields: ['HOST', 'PORT', 'SECURE', 'USERNAME', 'PASSWORD'],
          dataType: SettingDataType.OBJECT,
        },
      ];

      console.log('This is your configuration:');
      console.log(settings);

      rl.question('Do you want to proceed? (Y/n) ', async (answer) => {
        if (answer.toLowerCase() === 'n') {
          console.log('Operation cancelled.');
        } else {
          await prisma.setting.createMany({
            // @ts-ignore
            data: settings,
          });
          console.log('Settings have been saved.');
        }

        await prisma.$disconnect();
        rl.close();
      });
    });
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });