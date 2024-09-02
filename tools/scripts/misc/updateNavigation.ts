

import axios from "axios";
type ApiAuth = {
  url: string;
  accessToken: string;
};
const navData = {
  data: [
    {
      title: 'Communications',
      path: '/communications/text',
    },
  ],

  subData: [
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

const addSettings = async (config: ApiAuth) => {
  try {
    const response = await axios.post(
      `${config.url}/v1/settings`,
      {
        value: navData as object,
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
    console.log(response.data);
  }
  catch (e) {
    console.error(e);
  }

}

const baseUrl = 'http://localhost:5500';
const accessToken = ""

const main = async () => {
  await addSettings({
    url: baseUrl,
    accessToken,
  });
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })