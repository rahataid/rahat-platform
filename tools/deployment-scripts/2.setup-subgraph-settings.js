const {
  prompt,
  getDeploymentFiles,
  askTargetFile,
  buildSettingEntry,
  upsertSettingInDeploymentFile,
  askConfirmation,
} = require('./_common');

const SETTING_NAME = 'SUBGRAPH_URL';

async function askSubgraphUrl() {
  const answers = await prompt([
    {
      type: 'input',
      name: 'subgraphUrl',
      message: 'Enter SUBGRAPH_URL:',
      default: process.env.SUBGRAPH_URL || 'http://localhost:8000/subgraphs/name/rahat/core',
      validate: (input) => (input && input.trim() ? true : 'SUBGRAPH_URL is required.'),
      filter: (input) => input.trim(),
    },
  ]);

  return answers.subgraphUrl;
}

async function main() {
  const deploymentFiles = await getDeploymentFiles();

  if (!deploymentFiles.length) {
    throw new Error('No deployment files found. Run 0.setup-project.js first.');
  }

  const selectedFile = await askTargetFile(deploymentFiles, 'Select one deployment file to update:');
  const subgraphUrl = await askSubgraphUrl();

  console.log('Selected SUBGRAPH_URL value:');
  console.log(subgraphUrl);

  const confirmed = await askConfirmation(`Apply this setting to ${selectedFile}?`, true);

  if (!confirmed) {
    console.log('No deployment files were modified.');
    return;
  }

  const action = await upsertSettingInDeploymentFile(
    selectedFile,
    buildSettingEntry({
      name: SETTING_NAME,
      value: subgraphUrl,
      dataType: 'STRING',
      requiredFields: '{}',
      isReadOnly: false,
      isPrivate: false,
    })
  );

  console.log(`${action.toUpperCase()}: ${selectedFile}`);
}

main().catch((error) => {
  console.error('Failed to update SUBGRAPH_URL in deployment files.');
  console.error(error.message || error);
  process.exit(1);
});
