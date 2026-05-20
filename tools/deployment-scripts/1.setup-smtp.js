const {
  prompt,
  getDeploymentFiles,
  askTargetFile,
  buildSettingEntry,
  upsertSettingInDeploymentFile,
  askConfirmation,
} = require('./_common');

const SETTING_NAME = 'SMTP';

async function askSmtpDetails() {
  const answers = await prompt([
    {
      type: 'input',
      name: 'host',
      message: 'Enter SMTP HOST:',
      default: 'smtp.gmail.com',
      validate: (input) => (input && input.trim() ? true : 'SMTP HOST is required.'),
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'port',
      message: 'Enter SMTP PORT:',
      default: '465',
      validate: (input) => {
        const port = parseInt(input, 10);
        return !isNaN(port) && port > 0 && port <= 65535 ? true : 'Please enter a valid port number.';
      },
      filter: (input) => parseInt(input.trim(), 10),
    },
    {
      type: 'confirm',
      name: 'secure',
      message: 'Use secure connection (SSL/TLS)?',
      default: true,
    },
    {
      type: 'input',
      name: 'username',
      message: 'Enter SMTP USERNAME:',
      validate: (input) => (input && input.trim() ? true : 'SMTP USERNAME is required.'),
      filter: (input) => input.trim(),
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter SMTP PASSWORD:',
      mask: '*',
      validate: (input) => (input && input.trim() ? true : 'SMTP PASSWORD is required.'),
      filter: (input) => input.trim(),
    },
  ]);

  return {
    HOST: answers.host,
    PORT: answers.port,
    SECURE: answers.secure,
    USERNAME: answers.username,
    PASSWORD: answers.password,
  };
}

async function main() {
  const deploymentFiles = await getDeploymentFiles();

  if (!deploymentFiles.length) {
    throw new Error('No deployment files found. Run 0.setup-project.js first.');
  }

  const selectedFile = await askTargetFile(deploymentFiles, 'Select one deployment file to update:');
  const smtpConfig = await askSmtpDetails();

  console.log('\nSelected SMTP configuration:');
  console.log(JSON.stringify({
    ...smtpConfig,
    PASSWORD: '***HIDDEN***'
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
      value: smtpConfig,
      dataType: 'OBJECT',
      requiredFields: JSON.stringify(['HOST', 'PORT', 'SECURE', 'USERNAME', 'PASSWORD']),
      isReadOnly: true,
      isPrivate: true,
    })
  );

  console.log(`${action.toUpperCase()}: ${selectedFile}`);
}

main().catch((error) => {
  console.error('Failed to update SMTP settings in deployment files.');
  console.error(error.message || error);
  process.exit(1);
});
