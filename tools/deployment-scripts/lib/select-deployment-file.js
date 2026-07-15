const fs = require('fs/promises');
const path = require('path');
const inquirer = require('inquirer');

const prompt = inquirer.prompt ?? inquirer.default?.prompt;
const DEPLOYMENT_DIR = path.resolve(__dirname, '..', 'deployments');

async function getDeploymentFiles() {
	await fs.mkdir(DEPLOYMENT_DIR, { recursive: true });
	const entries = await fs.readdir(DEPLOYMENT_DIR, { withFileTypes: true });
	return entries
		.filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
		.map((entry) => entry.name)
		.sort((a, b) => a.localeCompare(b));
}

async function selectDeploymentFile() {
	const fileArg = process.argv.find((a) => a.startsWith('--file='));
	if (fileArg) {
		return fileArg.slice('--file='.length);
	}

	const deploymentFiles = await getDeploymentFiles();
	if (!deploymentFiles.length) {
		throw new Error(`No deployment files found in ${DEPLOYMENT_DIR}`);
	}

	const { selectedFile } = await prompt([
		{
			type: 'list',
			name: 'selectedFile',
			message: 'Select one deployment file to update:',
			choices: deploymentFiles.map((f) => ({ name: f, value: f })),
		},
	]);

	return selectedFile;
}

module.exports = { selectDeploymentFile, getDeploymentFiles, DEPLOYMENT_DIR };
