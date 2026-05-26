const fs = require('fs/promises');
const path = require('path');
const inquirer = require('inquirer');

const prompt = inquirer.prompt ?? inquirer.default?.prompt;
const DEPLOYMENT_DIR = path.resolve(__dirname, 'deployments');

async function ensureDeploymentDirectory() {
  await fs.mkdir(DEPLOYMENT_DIR, { recursive: true });
}

async function getDeploymentFiles() {
  await ensureDeploymentDirectory();
  const entries = await fs.readdir(DEPLOYMENT_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function askTargetFile(deploymentFiles, message = 'Select one deployment file:') {
  const answers = await prompt([
    {
      type: 'list',
      name: 'selectedFile',
      message,
      choices: deploymentFiles.map((fileName) => ({
        name: fileName,
        value: fileName,
      })),
    },
  ]);

  return answers.selectedFile;
}

async function readDeploymentFile(fileName) {
  const filePath = path.join(DEPLOYMENT_DIR, fileName);
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

async function writeDeploymentFile(fileName, payload) {
  const filePath = path.join(DEPLOYMENT_DIR, fileName);
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function buildSettingEntry({
  name,
  value,
  dataType = 'OBJECT',
  requiredFields = '{}',
  isReadOnly = false,
  isPrivate = false,
}) {
  return {
    name,
    value: typeof value === 'string' ? value : JSON.stringify(value),
    dataType,
    requiredFields,
    isReadOnly,
    isPrivate,
  };
}

async function upsertSettingInDeploymentFile(fileName, settingEntry) {
  const payload = await readDeploymentFile(fileName);
  const settings = Array.isArray(payload.settings) ? payload.settings : [];
  const existingIndex = settings.findIndex(
    (setting) => setting && setting.name === settingEntry.name
  );

  if (existingIndex >= 0) {
    settings[existingIndex] = settingEntry;
  } else {
    settings.push(settingEntry);
  }

  payload.settings = settings;
  await writeDeploymentFile(fileName, payload);

  return existingIndex >= 0 ? 'updated' : 'added';
}

async function askConfirmation(message, defaultValue = true) {
  const answers = await prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: defaultValue,
    },
  ]);

  return answers.confirmed;
}

module.exports = {
  prompt,
  DEPLOYMENT_DIR,
  ensureDeploymentDirectory,
  getDeploymentFiles,
  askTargetFile,
  readDeploymentFile,
  writeDeploymentFile,
  buildSettingEntry,
  upsertSettingInDeploymentFile,
  askConfirmation,
};
