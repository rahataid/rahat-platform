const {
  prompt,
  getDeploymentFiles,
  askTargetFile,
  buildSettingEntry,
  upsertSettingInDeploymentFile,
  askConfirmation,
} = require('./_common');

const SETTING_NAME = 'SMS_SETTINGS';

async function askSmsSettings() {
  const answers = await prompt([
    {
      type: 'input',
      name: 'url',
      message: 'Enter SMS_SETTINGS.url:',
      default: process.env.SMS_SETTINGS_URL || 'https://connect.rumsan.net/api/v1/broadcasts',
      validate: (input) => (input && input.trim() ? true : 'SMS_SETTINGS.url is required.'),
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'appId',
      message: 'Enter SMS_SETTINGS.appId:',
      default: process.env.SMS_SETTINGS_APP_ID || '',
      validate: (input) => (input && input.trim() ? true : 'SMS_SETTINGS.appId is required.'),
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'token',
      message: 'Enter SMS_SETTINGS.token:',
      default: process.env.SMS_SETTINGS_TOKEN || '',
      validate: (input) => (input && input.trim() ? true : 'SMS_SETTINGS.token is required.'),
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'message',
      message: 'Enter SMS_SETTINGS.message:',
      default: process.env.SMS_SETTINGS_MESSAGE || 'Hi, your OTP is ${otp} and the amount is ${amount}',
      validate: (input) => (input && input.trim() ? true : 'SMS_SETTINGS.message is required.'),
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'provider',
      message: 'Enter SMS_SETTINGS.provider:',
      default: process.env.SMS_SETTINGS_PROVIDER || 'default',
      validate: (input) => (input && input.trim() ? true : 'SMS_SETTINGS.provider is required.'),
      filter: (input) => input.trim(),
    },
  ]);

  return [answers];
}

async function main() {
  const deploymentFiles = await getDeploymentFiles();

  if (!deploymentFiles.length) {
    throw new Error('No deployment files found. Run 0.setup-project.js first.');
  }

  const selectedFile = await askTargetFile(deploymentFiles, 'Select one deployment file to update:');
  const settingValue = await askSmsSettings();

  console.log('Selected SMS_SETTINGS value:');
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
      requiredFields: '{}',
      isReadOnly: false,
      isPrivate: false,
    })
  );

  console.log(`${action.toUpperCase()}: ${selectedFile}`);
}

main().catch((error) => {
  console.error('Failed to update SMS_SETTINGS in deployment files.');
  console.error(error.message || error);
  process.exit(1);
});
