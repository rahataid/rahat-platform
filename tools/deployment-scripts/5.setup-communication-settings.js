const {
  prompt,
  getDeploymentFiles,
  askTargetFile,
  buildSettingEntry,
  upsertSettingInDeploymentFile,
  askConfirmation,
} = require('./_common');

const SETTING_NAME = 'COMMUNICATION';

async function askCommunicationSettings() {
  const answers = await prompt([
    {
      type: 'input',
      name: 'URL',
      message: 'Enter COMMUNICATION.URL:',
      default: process.env.COMMUNICATION_URL || 'https://connect.rumsan.net/api/v1',
      validate: (input) => (input && input.trim() ? true : 'COMMUNICATION.URL is required.'),
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'APP_ID',
      message: 'Enter COMMUNICATION.APP_ID:',
      default: process.env.COMMUNICATION_APP_ID || '',
      validate: (input) => (input && input.trim() ? true : 'COMMUNICATION.APP_ID is required.'),
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'SMS_TRANSPORT_ID',
      message: 'Enter COMMUNICATION.SMS_TRANSPORT_ID:',
      default: process.env.SMS_TRANSPORT_ID || '',
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'STATIC_OTP',
      message: 'Enter COMMUNICATION.STATIC_OTP:',
      default: process.env.STATIC_OTP || '1234',
      filter: (input) => input.trim(),
    },
    {
      type: 'confirm',
      name: 'USE_STATIC_OTP',
      message: 'Enable COMMUNICATION.USE_STATIC_OTP?',
      default: String(process.env.USE_STATIC_OTP || 'true').toLowerCase() !== 'false',
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
  const settingValue = await askCommunicationSettings();

  console.log('Selected COMMUNICATION value:');
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
      requiredFields: '["URL","APP_ID","STATIC_OTP","USE_STATIC_OTP"]',
      isReadOnly: false,
      isPrivate: false,
    })
  );

  console.log(`${action.toUpperCase()}: ${selectedFile}`);
}

main().catch((error) => {
  console.error('Failed to update COMMUNICATION in deployment files.');
  console.error(error.message || error);
  process.exit(1);
});
