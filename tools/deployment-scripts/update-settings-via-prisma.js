const fs = require('fs/promises');
const path = require('path');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const DEPLOYMENT_DIR = path.resolve(__dirname, 'deployments');

const prisma = new PrismaClient({
  datasourceUrl: process.env.CORE_DATABASE_URL,
});

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function getDeploymentFiles() {
  await fs.mkdir(DEPLOYMENT_DIR, { recursive: true });
  const entries = await fs.readdir(DEPLOYMENT_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

async function selectFile(files) {
  console.log('\nAvailable deployment files:');
  files.forEach((f, i) => console.log(`  ${i + 1}) ${f}`));

  const answer = await ask(`\nEnter number (1-${files.length}): `);
  const index = parseInt(answer, 10) - 1;

  if (index < 0 || index >= files.length || Number.isNaN(index)) {
    throw new Error(`Invalid selection: "${answer}"`);
  }

  return files[index];
}

async function confirm(message) {
  const answer = await ask(`${message} [Y/n]: `);
  return answer === '' || answer.toLowerCase() === 'y';
}

function normalizeRequiredFields(requiredFields) {
  if (Array.isArray(requiredFields)) {
    return requiredFields.map((field) => String(field));
  }

  if (typeof requiredFields !== 'string') {
    return [];
  }

  const trimmed = requiredFields.trim();

  if (!trimmed || trimmed === '{}' || trimmed === '[]') {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed.map((field) => String(field)) : [];
  } catch {
    return [];
  }
}

function parseValueForPrisma(setting) {
  const { value, dataType } = setting;

  if (typeof value !== 'string') {
    return value;
  }

  if (dataType === 'OBJECT') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  if (dataType === 'NUMBER') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }

  if (dataType === 'BOOLEAN') {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  }

  return value;
}

async function getSettingsFromFile(fileName) {
  const filePath = path.join(DEPLOYMENT_DIR, fileName);
  const content = await fs.readFile(filePath, 'utf8');
  const payload = JSON.parse(content);
  const settings = Array.isArray(payload.settings) ? payload.settings : [];
  return settings.filter((setting) => setting && setting.name);
}

async function upsertSetting(setting) {
  const settingForDb = {
    name: setting.name,
    value: parseValueForPrisma(setting),
    dataType: setting.dataType,
    requiredFields: normalizeRequiredFields(setting.requiredFields),
    isReadOnly: Boolean(setting.isReadOnly),
    isPrivate: Boolean(setting.isPrivate),
  };

  return prisma.setting.upsert({
    where: { name: settingForDb.name },
    update: {
      value: settingForDb.value,
      dataType: settingForDb.dataType,
      requiredFields: settingForDb.requiredFields,
      isReadOnly: settingForDb.isReadOnly,
      isPrivate: settingForDb.isPrivate,
    },
    create: settingForDb,
  });
}

async function main() {
  const deploymentFiles = await getDeploymentFiles();

  if (!deploymentFiles.length) {
    throw new Error(`No deployment files found in ${DEPLOYMENT_DIR}`);
  }

  const selectedFile = await selectFile(deploymentFiles);
  const settings = await getSettingsFromFile(selectedFile);

  if (!settings.length) {
    throw new Error(`${selectedFile} does not contain any settings.`);
  }

  console.log(`\nSelected: ${selectedFile}`);
  console.log(`Settings to sync: ${settings.map((s) => s.name).join(', ')}`);

  const confirmed = await confirm(`\nSync these settings from ${selectedFile} to the database?`);

  if (!confirmed) {
    console.log('Database sync cancelled.');
    return;
  }

  let upsertedCount = 0;

  for (const setting of settings) {
    const result = await upsertSetting(setting);
    upsertedCount += 1;
    console.log(`UPSERTED: ${result.name}`);
  }

  console.log(`Completed upserting ${upsertedCount} setting(s) from ${selectedFile}.`);
}

main()
  .catch((error) => {
    console.error('Failed to update tbl_settings from deployment settings.');
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
