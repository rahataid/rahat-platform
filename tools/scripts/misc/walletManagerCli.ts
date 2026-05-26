import inquirer from 'inquirer';
import { readFileSync } from 'fs';
import * as path from 'path';
import { ethers } from 'ethers';

type Action =
	| 'wallet-details'
	| 'eth-balance'
	| 'eth-send'
	| 'erc20-balance'
	| 'erc20-send'
	| 'exit';

const ERC20_ABI = [
	'function balanceOf(address owner) view returns (uint256)',
	'function transfer(address to, uint256 amount) returns (bool)',
	'function decimals() view returns (uint8)',
	'function symbol() view returns (string)',
] as const;

type SupportedNetwork = {
	key: string;
	name: string;
	chainId: number;
	rpcUrl: string;
	nativeSymbol: string;
};

type WalletSession = {
	privateKey: string;
	address: string;
};

function loadSupportedNetworks(): SupportedNetwork[] {
	const filePath = path.join(__dirname, 'supported-networks.json');
	const raw = readFileSync(filePath, 'utf-8');
	const parsed = JSON.parse(raw) as SupportedNetwork[];

	if (!Array.isArray(parsed) || parsed.length === 0) {
		throw new Error('supported-networks.json must contain at least one network');
	}

	for (const network of parsed) {
		if (!network.key || !network.name || !network.rpcUrl || !network.nativeSymbol) {
			throw new Error('Each network must include key, name, rpcUrl and nativeSymbol');
		}
		if (typeof network.chainId !== 'number') {
			throw new Error(`Network ${network.name} is missing a valid numeric chainId`);
		}
	}

	return parsed;
}

function normalizePrivateKey(privateKey: string): string {
	return privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
}

function toWallet(privateKey: string, provider?: ethers.Provider): ethers.Wallet {
	const normalized = normalizePrivateKey(privateKey.trim());
	return provider ? new ethers.Wallet(normalized, provider) : new ethers.Wallet(normalized);
}

function getProvider(rpcUrl: string): ethers.JsonRpcProvider {
	return new ethers.JsonRpcProvider(rpcUrl.trim());
}

async function askPrivateKey(): Promise<string> {
	const defaultPrivateKey = process.env.PRIVATE_KEY ?? '';
	const response = await inquirer.prompt<{ privateKey: string }>([
		{
			type: 'password',
			name: 'privateKey',
			message: 'Enter private key:',
			default: defaultPrivateKey,
			mask: '*',
			validate: (value: string) => {
				if (!value?.trim()) return 'Private key is required';
				try {
					toWallet(value.trim());
					return true;
				} catch {
					return 'Invalid private key';
				}
			},
		},
	]);

	return response.privateKey.trim();
}

async function askNetwork(): Promise<SupportedNetwork> {
	const supportedNetworks = loadSupportedNetworks();
	const response = await inquirer.prompt<{ networkKey: string }>([
		{
			type: 'list',
			name: 'networkKey',
			message: 'Select supported network:',
			choices: supportedNetworks.map((network) => ({
				name: `${network.name} (chainId: ${network.chainId})`,
				value: network.key,
			})),
		},
	]);

	const selected = supportedNetworks.find((network) => network.key === response.networkKey);
	if (!selected) {
		throw new Error('Invalid network selection');
	}

	return selected;
}

async function showWalletDetails(session: WalletSession) {
	console.log('\nWallet details:');
	console.log(`Address: ${session.address}`);
}

async function checkEthBalance(session: WalletSession) {
	const network = await askNetwork();

	const provider = getProvider(network.rpcUrl);
	const balance = await provider.getBalance(session.address);

	console.log(`\n${network.nativeSymbol} balance on ${network.name}:`);
	console.log(`Address: ${session.address}`);
	console.log(`Balance: ${ethers.formatEther(balance)} ${network.nativeSymbol}`);
}

async function sendEth(session: WalletSession) {
	const network = await askNetwork();

	const txData = await inquirer.prompt<{ to: string; amountEth: string }>([
		{
			type: 'input',
			name: 'to',
			message: 'Recipient address:',
			validate: (value: string) => (ethers.isAddress(value.trim()) ? true : 'Invalid address'),
		},
		{
			type: 'input',
			name: 'amountEth',
			message: 'Amount (ETH):',
			validate: (value: string) => {
				try {
					const parsed = ethers.parseEther(value.trim());
					return parsed > 0n ? true : 'Amount must be greater than 0';
				} catch {
					return 'Invalid ETH amount';
				}
			},
		},
	]);

	const provider = getProvider(network.rpcUrl);
	const wallet = toWallet(session.privateKey, provider);
	const tx = await wallet.sendTransaction({
		to: txData.to.trim(),
		value: ethers.parseEther(txData.amountEth.trim()),
	});

	console.log(`\nTransaction submitted: ${tx.hash}`);
	const receipt = await tx.wait();
	console.log(`Transaction confirmed in block: ${receipt?.blockNumber}`);
	console.log(`Sent ${txData.amountEth.trim()} ${network.nativeSymbol} on ${network.name}`);
}

async function checkErc20Balance(session: WalletSession) {
	const network = await askNetwork();

	const response = await inquirer.prompt<{ tokenAddress: string }>([
		{
			type: 'input',
			name: 'tokenAddress',
			message: 'ERC20 token contract address:',
			validate: (value: string) => (ethers.isAddress(value.trim()) ? true : 'Invalid token address'),
		},
	]);

	const provider = getProvider(network.rpcUrl);
	const token = new ethers.Contract(response.tokenAddress.trim(), ERC20_ABI, provider);

	const [rawBalance, decimals, symbol] = await Promise.all([
		token.balanceOf(session.address),
		token.decimals(),
		token.symbol(),
	]);

	console.log(`\nERC20 balance on ${network.name}:`);
	console.log(`Address: ${session.address}`);
	console.log(`Token: ${symbol} (${response.tokenAddress.trim()})`);
	console.log(`Balance: ${ethers.formatUnits(rawBalance, decimals)} ${symbol}`);
}

async function sendErc20(session: WalletSession) {
	const network = await askNetwork();

	const response = await inquirer.prompt<{
		tokenAddress: string;
		to: string;
		amount: string;
	}>([
		{
			type: 'input',
			name: 'tokenAddress',
			message: 'ERC20 token contract address:',
			validate: (value: string) => (ethers.isAddress(value.trim()) ? true : 'Invalid token address'),
		},
		{
			type: 'input',
			name: 'to',
			message: 'Recipient address:',
			validate: (value: string) => (ethers.isAddress(value.trim()) ? true : 'Invalid recipient address'),
		},
		{
			type: 'input',
			name: 'amount',
			message: 'Amount (human-readable token units):',
			validate: (value: string) => {
				if (!value?.trim()) return 'Amount is required';
				return Number(value) > 0 ? true : 'Amount must be greater than 0';
			},
		},
	]);

	const provider = getProvider(network.rpcUrl);
	const wallet = toWallet(session.privateKey, provider);
	const token = new ethers.Contract(response.tokenAddress.trim(), ERC20_ABI, wallet);

	const [decimals, symbol] = await Promise.all([token.decimals(), token.symbol()]);
	const amountSmallestUnit = ethers.parseUnits(response.amount.trim(), decimals);
	const tx = await token.transfer(response.to.trim(), amountSmallestUnit);

	console.log(`\nTransaction submitted: ${tx.hash}`);
	const receipt = await tx.wait();
	console.log(`Transaction confirmed in block: ${receipt?.blockNumber}`);
	console.log(`Sent ${response.amount.trim()} ${symbol} to ${response.to.trim()} on ${network.name}`);
}

async function runAction(action: Action, session: WalletSession): Promise<boolean> {
	switch (action) {
		case 'wallet-details':
			await showWalletDetails(session);
			return true;
		case 'eth-balance':
			await checkEthBalance(session);
			return true;
		case 'eth-send':
			await sendEth(session);
			return true;
		case 'erc20-balance':
			await checkErc20Balance(session);
			return true;
		case 'erc20-send':
			await sendErc20(session);
			return true;
		case 'exit':
			return false;
		default:
			return false;
	}
}

async function main() {
	console.log('Interactive wallet utility (ethers.js)');
	console.log('Setup wallet to begin.');

	const privateKey = await askPrivateKey();
	const wallet = toWallet(privateKey);
	const session: WalletSession = {
		privateKey,
		address: wallet.address,
	};

	console.log(`Wallet loaded: ${session.address}`);

	let keepRunning = true;
	while (keepRunning) {
		const selection = await inquirer.prompt<{ action: Action }>([
			{
				type: 'list',
				name: 'action',
				message: 'Select an action:',
				choices: [
					{ name: 'Get wallet details (from private key)', value: 'wallet-details' },
					{ name: 'Check ETH balance', value: 'eth-balance' },
					{ name: 'Send ETH', value: 'eth-send' },
					{ name: 'Check ERC20 token balance', value: 'erc20-balance' },
					{ name: 'Send ERC20 token', value: 'erc20-send' },
					{ name: 'Exit', value: 'exit' },
				],
			},
		]);

		try {
			keepRunning = await runAction(selection.action, session);
		} catch (error) {
			console.error('Action failed:', error instanceof Error ? error.message : error);
		}

		if (keepRunning) {
			console.log('');
		}
	}

	console.log('Goodbye.');
}

main().catch((error) => {
	console.error('Fatal error:', error instanceof Error ? error.message : error);
	process.exit(1);
});
