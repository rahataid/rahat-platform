const {
  prompt,
  getDeploymentFiles,
  askTargetFile,
  buildSettingEntry,
  upsertSettingInDeploymentFile,
  askConfirmation,
} = require('./_common');

const SETTING_NAME = 'CLOUDFLARE_R2';

async function askCloudflareR2Details() {
  const answers = await prompt([
    {
      type: 'input',
      name: 'bucket',
      message: 'Enter R2_BUCKET:',
      validate: (input) => (input && input.trim() ? true : 'R2_BUCKET is required.'),
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'accountId',
      message: 'Enter R2_ACCOUNT_ID:',
      validate: (input) => (input && input.trim() ? true : 'R2_ACCOUNT_ID is required.'),
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'accessKeyId',
      message: 'Enter R2_ACCESS_KEY_ID:',
      validate: (input) => (input && input.trim() ? true : 'R2_ACCESS_KEY_ID is required.'),
      filter: (input) => input.trim(),
    },
    {
      type: 'password',
      name: 'secretAccessKey',
      message: 'Enter R2_SECRET_ACCESS_KEY:',
      mask: '*',
      validate: (input) => (input && input.trim() ? true : 'R2_SECRET_ACCESS_KEY is required.'),
      filter: (input) => input.trim(),
    },
  ]);

  return {
    R2_BUCKET: answers.bucket,
    R2_ACCOUNT_ID: answers.accountId,
    R2_ACCESS_KEY_ID: answers.accessKeyId,
    R2_SECRET_ACCESS_KEY: answers.secretAccessKey,
  };
}

async function main() {
  const deploymentFiles = await getDeploymentFiles();

  if (!deploymentFiles.length) {
    throw new Error('No deployment files found. Run 0.setup-project.js first.');
  }

  const selectedFile = await askTargetFile(deploymentFiles, 'Select one deployment file to update:');
  const r2Config = await askCloudflareR2Details();

  console.log('\nSelected Cloudflare R2 configuration:');
  console.log(JSON.stringify({
    ...r2Config,
    R2_SECRET_ACCESS_KEY: '***HIDDEN***',
  }, null, 2));

  const confirmed = await askConfirmation(`Apply this setting to ${selectedFile}?`, true);

  if (!confirmed) {
    console.log('No deployment files were modified.');
    return;
  }

  const action = await upsertSettingInDeploymentFile(
    selectedFile,
    buildSettingEntry({
      name: SETTING_NAME,
      value: r2Config,
      dataType: 'OBJECT',
      requiredFields: JSON.stringify(['R2_BUCKET', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']),
      isReadOnly: false,
      isPrivate: true,
    })
  );

  console.log(`${action.toUpperCase()}: ${selectedFile}`);
}

main().catch((error) => {
  console.error('Failed to update Cloudflare R2 settings in deployment files.');
  console.error(error.message || error);
  process.exit(1);
});
