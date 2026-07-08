const {
  prompt,
  buildSettingEntry,
  upsertSettingInDeploymentFile,
  askConfirmation,
} = require('./_common');
const { selectDeploymentFile } = require('./lib/select-deployment-file');

const SETTING_NAME = 'FUND_VENDOR_WALLET';

async function askFundVendorWalletDetails() {
  const answers = await prompt([
    {
      type: 'list',
      name: 'fundVendorWallet',
      message: 'Should vendor wallet be funded on creation?',
      choices: [
        { name: 'true', value: 'true' },
        { name: 'false', value: 'false' },
      ],
      default: 'false',
    },
  ]);

  return answers.fundVendorWallet;
}

async function main() {
  const selectedFile = await selectDeploymentFile();
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
