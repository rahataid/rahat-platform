
import axios from "axios";
import readline from "readline";

type ApiAuth = {
  url: string;
  accessToken: string;
};

const navData = {
  data: [
    // {
    //   title: 'Communication',
    //   path: '/communications',
    // }
  ],
  subData: [
    // {
    //   title: 'Users',
    //   path: '/users',
    // },
    {
      title: 'Treasury',
      path: '/treasury',
    },
    {
      title: 'Vendors',
      path: '/vendors',
    },
    {
      title: 'Import Beneficiary from CT',
      path: '/community-beneficiary',
    },
  ],
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askUser = (question: string) => {
  return new Promise<string>((resolve) => rl.question(question, resolve));
};

const getSettings = async (config: ApiAuth, name: string) => {
  try {
    const response = await axios.get(`${config.url}/v1/settings/${name}`, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    });
    return response.data;
  } catch (e: any) {
    console.error("Error fetching settings:", e.message);
    return null;
  }
};

const addSettings = async (config: ApiAuth) => {
  try {
    const response = await axios.post(
      `${config.url}/v1/settings`,
      {
        value: navData,
        isPrivate: false,
        isReadOnly: false,
        name: 'NAV_SETTINGS',
        dataType: 'OBJECT',
        requiredFields: ['data', 'subData'],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.accessToken}`,
        },
      }
    );
    console.log("Settings added:", response.data);
  } catch (e: any) {
    console.error("Error adding settings:", e.message);
  }
};

const updateSettings = async (config: ApiAuth) => {
  try {
    const response = await axios.patch(
      `${config.url}/v1/settings/NAV_SETTINGS`,
      {
        value: navData,
        requiredFields: ['data', 'subData'],
        isPrivate: false,
        isReadOnly: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.accessToken}`,
        },
      }
    );
    console.log("Settings updated:", response.data);
  } catch (e: any) {
    console.error("Error updating settings:", e.message);
  }
};

const addOrUpdateSettings = async (config: ApiAuth) => {
  const existingSettings = await getSettings(config, 'NAV_SETTINGS');
  console.log({ existingSettings })
  if (!existingSettings.data) {
    await addSettings(config);
    return;
  }

  const answer = await askUser('Settings already exist. Do you want to update them? (yes/no): ');
  if (answer.toLowerCase() === 'yes') {
    await updateSettings(config);
  } else {
    console.log("Settings were not updated.");
  }
};

const baseUrl = 'https://api.nx.dev.rahat.io';
const accessToken = "";

const main = async () => {
  await addOrUpdateSettings({
    url: baseUrl,
    accessToken,
  });
  rl.close();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
