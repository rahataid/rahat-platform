const {
  prompt,
  getDeploymentFiles,
  askTargetFile,
  buildSettingEntry,
  upsertSettingInDeploymentFile,
  askConfirmation,
} = require('./_common');

const SETTING_NAME = 'FUND_VENDOR_WALLET';

async function askFundVendorWalletDetails() {
  const answers = await prompt([
    {
      type: 'confirm',
      name: 'fundVendorWallet',
      message: 'Should vendor wallet be funded on creation?',
      default: false,
    },
  ]);

  return answers.fundVendorWallet ? 'true' : 'false';
}

async function main() {
  const deploymentFiles = await getDeploymentFiles();

  if (!deploymentFiles.length) {
    throw new Error('No deployment files found. Run 0.setup-project.js first.');
  }

  const selectedFile = await askTargetFile(deploymentFiles, 'Select one deployment file to update:');
  const fundVendorWallet = await askFundVendorWalletDetails();

  console.log('\nSelected configuration:');
  console.log(JSON.stringify({ FUND_VENDOR_WALLET: fundVendorWallet }, null, 2));

  const confirmed = await askConfirmation(`Apply this setting to ${selectedFile}?`, true);

  if (!confirmed) {
    console.log('No deployment files were modified.');
    return;
  }

  const action = await upsertSettingInDeploymentFile(
    selectedFile,
    buildSettingEntry({
      name: SETTING_NAME,
      value: fundVendorWallet,
      dataType: 'STRING',
      requiredFields: JSON.stringify({}),
      isReadOnly: false,
      isPrivate: false,
    })
  );

  console.log(`${action.toUpperCase()}: ${selectedFile}`);
}

main().catch((error) => {
  console.error('Failed to update FUND_VENDOR_WALLET setting in deployment files.');
  console.error(error.message || error);
  process.exit(1);
});
