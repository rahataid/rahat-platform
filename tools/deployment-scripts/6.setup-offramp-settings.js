const {
  prompt,
  getDeploymentFiles,
  askTargetFile,
  buildSettingEntry,
  upsertSettingInDeploymentFile,
  askConfirmation,
} = require('./_common');

const SETTING_NAME = 'OFFRAMP_SETTINGS';

async function askOfframpSettings() {
  const answers = await prompt([
    {
      type: 'input',
      name: 'URL',
      message: 'Enter OFFRAMP_SETTINGS.URL:',
      default: process.env.PAYMENT_PROVIDER_URL || 'https://api-offramp-dev.rahat.io/v1',
      validate: (input) => (input && input.trim() ? true : 'OFFRAMP_SETTINGS.URL is required.'),
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'APPID',
      message: 'Enter OFFRAMP_SETTINGS.APPID:',
      default: process.env.PAYMENT_PROVIDER_APP_ID || '',
      validate: (input) => (input && input.trim() ? true : 'OFFRAMP_SETTINGS.APPID is required.'),
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'ACCESSTOKEN',
      message: 'Enter OFFRAMP_SETTINGS.ACCESSTOKEN:',
      default: process.env.PAYMENT_PROVIDER_ACCESS_TOKEN || '',
      validate: (input) => (input && input.trim() ? true : 'OFFRAMP_SETTINGS.ACCESSTOKEN is required.'),
      filter: (input) => input.trim(),
    },
  ]);

  return answers;
}

async function main() {
  const deploymentFiles = await getDeploymentFiles();

  if (!deploymentFiles.length) {
    throw new Error('No deployment files found. Run 0.setup-project.js first.');
  }

  const selectedFile = await askTargetFile(deploymentFiles, 'Select one deployment file to update:');
  const settingValue = await askOfframpSettings();

  console.log('Selected OFFRAMP_SETTINGS value:');
  console.log(JSON.stringify(settingValue, null, 2));

  const confirmed = await askConfirmation(`Apply this setting to ${selectedFile}?`, true);

  if (!confirmed) {
    console.log('No deployment files were modified.');
    return;
  }

  const action = await upsertSettingInDeploymentFile(
    selectedFile,
    buildSettingEntry({
      name: SETTING_NAME,
      value: settingValue,
      dataType: 'OBJECT',
      requiredFields: '["URL","APPID","ACCESSTOKEN"]',
      isReadOnly: false,
      isPrivate: false,
    })
  );

  console.log(`${action.toUpperCase()}: ${selectedFile}`);
}

main().catch((error) => {
  console.error('Failed to update OFFRAMP_SETTINGS in deployment files.');
  console.error(error.message || error);
  process.exit(1);
});
