/**
 * 3.setup-keys.js
 *
 * Step 3 of the deployment setup workflow.
 *
 * Generates or imports an Ethereum deployer wallet and saves the key material
 * into the selected deployment file. The wallet is used in step 4 to deploy
 * smart contracts on-chain.
 *
 * What it does:
 *   - Prompts to select the target deployment file
 *   - Offers three wallet options:
 *       1. Generate a brand-new random wallet
 *       2. Import from an existing mnemonic phrase
 *       3. Import from an existing private key
 *   - Saves the wallet address as the DEPLOYER_PRIVATE_KEY setting
 *   - Saves full key material (address, privateKey, mnemonic) under a top-level
 *     `Keys` object in the deployment file
 *
 * Prerequisites:
 *   - A deployment file must exist (run 0.setup-project.js first)
 *   - After this step, fund the wallet with native tokens (ETH, POL, etc.)
 *     before running the contract deployment script
 *
 * Security note:
 *   - The deployment file will contain sensitive private key data.
 *     Keep it out of version control.
 *
 * Usage:
 *   node tools/deployment-scripts/3.setup-keys.js
 */

const fs = require('fs/promises');
const path = require('path');
const inquirer = require('inquirer');
const { Wallet } = require('ethers');

const prompt = inquirer.prompt ?? inquirer.default?.prompt;

const DEPLOYMENT_DIR = path.resolve(__dirname, 'deployments');
const ADDRESS_SETTING_NAME = 'DEPLOYER_PRIVATE_KEY';

function buildAddressSettingEntry(address) {
	return {
		name: ADDRESS_SETTING_NAME,
		value: address,
		dataType: 'STRING',
		requiredFields: '{}',
		isReadOnly: false,
		isPrivate: false,
	};
}

function generateWalletData() {
	const wallet = Wallet.createRandom();

	return {
		address: wallet.address,
		privateKey: wallet.privateKey,
		mnemonic: wallet.mnemonic?.phrase ?? '',
	};
}

function buildWalletDataFromWallet(wallet, mnemonicOverride = '') {
	return {
		address: wallet.address,
		privateKey: wallet.privateKey,
		mnemonic: mnemonicOverride || wallet.mnemonic?.phrase || '',
	};
}

function tryCreateWalletFromMnemonic(mnemonic) {
	try {
		return Wallet.fromPhrase(mnemonic.trim());
	} catch {
		return null;
	}
}

function tryCreateWalletFromPrivateKey(privateKey) {
	try {
		return new Wallet(privateKey.trim());
	} catch {
		return null;
	}
}

async function getDeploymentFiles() {
	await fs.mkdir(DEPLOYMENT_DIR, { recursive: true });
	const entries = await fs.readdir(DEPLOYMENT_DIR, { withFileTypes: true });

	return entries
		.filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
		.map((entry) => entry.name)
		.sort((left, right) => left.localeCompare(right));
}

async function askTargetFile(deploymentFiles) {
	const answers = await prompt([
		{
			type: 'list',
			name: 'selectedFile',
			message: 'Select one deployment file to update:',
			choices: deploymentFiles.map((fileName) => ({
				name: fileName,
				value: fileName,
			})),
		},
	]);

	return answers.selectedFile;
}

async function askWalletSource() {
	const answers = await prompt([
		{
			type: 'list',
			name: 'walletSource',
			message: 'Choose how to set wallet keys:',
			choices: [
				{ name: 'Create a new wallet', value: 'new' },
				{ name: 'Use my own mnemonic', value: 'mnemonic' },
				{ name: 'Use my own private key', value: 'privateKey' },
			],
			default: 'new',
		},
	]);

	return answers.walletSource;
}

async function askMnemonic() {
	const answers = await prompt([
		{
			type: 'password',
			name: 'mnemonic',
			message: 'Enter your mnemonic phrase:',
			mask: '*',
			validate: (input) => {
				if (!input || !input.trim()) {
					return 'Mnemonic is required.';
				}

				if (!tryCreateWalletFromMnemonic(input)) {
					return 'Invalid mnemonic phrase.';
				}

				return true;
			},
			filter: (input) => input.trim(),
		},
	]);

	return answers.mnemonic;
}

async function askPrivateKey() {
	const answers = await prompt([
		{
			type: 'password',
			name: 'privateKey',
			message: 'Enter your private key:',
			mask: '*',
			validate: (input) => {
				if (!input || !input.trim()) {
					return 'Private key is required.';
				}

				if (!tryCreateWalletFromPrivateKey(input)) {
					return 'Invalid private key.';
				}

				return true;
			},
			filter: (input) => input.trim(),
		},
	]);

	return answers.privateKey;
}

async function getWalletDataFromChoice() {
	const walletSource = await askWalletSource();

	if (walletSource === 'new') {
		// Generate a fresh BIP-39 wallet; mnemonic is captured from the wallet itself
		return generateWalletData();
	}

	if (walletSource === 'mnemonic') {
		// Derive the wallet from the phrase; re-pass the original mnemonic string
		// so it is stored exactly as typed (including any extra whitespace that was trimmed)
		const mnemonic = await askMnemonic();
		const wallet = Wallet.fromPhrase(mnemonic);
		return buildWalletDataFromWallet(wallet, mnemonic);
	}

	// Private-key path: mnemonic will be empty string since we do not have one
	const privateKey = await askPrivateKey();
	const wallet = new Wallet(privateKey);
	return buildWalletDataFromWallet(wallet, '');
}

async function confirmSelection(selectedFile, walletData) {
	console.log('\nSelected wallet details:');
	console.log(JSON.stringify(walletData, null, 2));

	const answers = await prompt([
		{
			type: 'confirm',
			name: 'confirmed',
			message: `Apply wallet details to ${selectedFile}?`,
			default: true,
		},
	]);

	return answers.confirmed;
}

async function updateDeploymentFile(fileName, walletData) {
	const filePath = path.join(DEPLOYMENT_DIR, fileName);
	const content = await fs.readFile(filePath, 'utf8');
	const payload = JSON.parse(content);
	const settings = Array.isArray(payload.settings) ? payload.settings : [];
	const addressSetting = buildAddressSettingEntry(walletData.address);
	const existingIndex = settings.findIndex(
		(setting) => setting && setting.name === ADDRESS_SETTING_NAME
	);

	if (existingIndex >= 0) {
		settings[existingIndex] = addressSetting;
	} else {
		settings.push(addressSetting);
	}

	payload.settings = settings;
	payload.Keys = {
		name: ADDRESS_SETTING_NAME,
		address: walletData.address,
		privateKey: walletData.privateKey,
		mnemonic: walletData.mnemonic,
	};

	await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

	return existingIndex >= 0 ? 'updated' : 'added';
}

async function main() {
	const deploymentFiles = await getDeploymentFiles();

	if (!deploymentFiles.length) {
		throw new Error(`No deployment files found in ${DEPLOYMENT_DIR}`);
	}

	const selectedFile = await askTargetFile(deploymentFiles);
	const walletData = await getWalletDataFromChoice();
	const confirmed = await confirmSelection(selectedFile, walletData);

	if (!confirmed) {
		console.log('No deployment files were modified.');
		return;
	}

	const action = await updateDeploymentFile(selectedFile, walletData);
	console.log(`${action.toUpperCase()}: ${ADDRESS_SETTING_NAME} in ${selectedFile}`);
	console.log(`UPDATED: Keys in ${selectedFile}`);
	console.log('NOTE: fund this wallet with your preferred network native tokens like ETH,');
}

main().catch((error) => {
	console.error('Failed to set up wallet keys in deployment file.');
	console.error(error.message || error);
	process.exit(1);
});
