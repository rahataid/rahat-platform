const fs = require('fs/promises');
const path = require('path');
const { prompt, DEPLOYMENT_DIR, ensureDeploymentDirectory, askConfirmation, buildSettingEntry } = require('./_common');

async function askProjectId() {
  const answers = await prompt([
    {
      type: 'input',
      name: 'projectId',
      message: 'Enter the deployment file name (without .json):',
      validate: (input) => {
        if (!input || !input.trim()) {
          return 'Deployment file name is required.';
        }

        return true;
      },
      filter: (input) => input.trim(),
    },
  ]);

  return answers.projectId;
}

async function askFrontendUrl() {
  const answers = await prompt([
    {
      type: 'input',
      name: 'frontendUrl',
      message: 'Enter the FRONTEND_URL:',
      validate: (input) => (input && input.trim() ? true : 'FRONTEND_URL is required.'),
      filter: (input) => input.trim(),
    },
  ]);

  return answers.frontendUrl;
}

async function main() {
  await ensureDeploymentDirectory();
  const projectId = await askProjectId();
  const frontendUrl = await askFrontendUrl();
  const fileName = `${projectId}.json`;
  const filePath = path.join(DEPLOYMENT_DIR, fileName);

  let shouldWrite = true;

  try {
    await fs.access(filePath);
    shouldWrite = await askConfirmation(
      `${fileName} already exists. Overwrite it?`,
      false
    );
  } catch {
    shouldWrite = true;
  }

  if (!shouldWrite) {
    console.log('No deployment files were modified.');
    return;
  }

  const payload = {
    projectId,
    createdAt: new Date().toISOString(),
    settings: [
      buildSettingEntry({
        name: 'FRONTEND_URL',
        value: frontendUrl,
        dataType: 'STRING',
        requiredFields: '[]',
        isReadOnly: false,
        isPrivate: false,
      }),
    ],
  };

  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`CREATED: ${fileName}`);
}

main().catch((error) => {
  console.error('Failed to create deployment file.');
  console.error(error.message || error);
  process.exit(1);
});
