import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@rumsan/prisma';
import * as readline from 'readline';

const prisma = new PrismaService();
const prismaClient = new PrismaClient();

// Setup readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

interface ChainConfigInput {
    name: string;
    chain: string;
    chainId?: string;
    rpcUrl: string[];
    explorerUrl?: string;
    currencyName?: string;
    currencySymbol?: string;
    isActive: boolean;
    isDefault: boolean;
    contractDetails?: Record<string, unknown>;
    extras?: Record<string, unknown>;
}

const askQuestion = (question: string): Promise<string> => {
    return new Promise((resolve) => rl.question(question, resolve));
};

const parseJsonInput = async (prompt: string): Promise<Record<string, unknown> | undefined> => {
    const input = await askQuestion(prompt);
    if (!input.trim()) return undefined;

    try {
        return JSON.parse(input);
    } catch (e) {
        console.error('Invalid JSON. Please enter valid JSON or leave empty.');
        return parseJsonInput(prompt);
    }
};

const collectChainConfig = async (): Promise<ChainConfigInput> => {
    console.log('\n=== Add New Chain Configuration ===\n');

    const name = await askQuestion('Chain Name (e.g., Base Sepolia, Stellar Testnet): ');
    const chain = await askQuestion('Chain Type (evm, stellar, etc.): ');
    const chainId = await askQuestion('Chain ID (optional, press Enter to skip): ');
    const rpcUrlInput = await askQuestion('RPC URL(s) (comma-separated for multiple URLs): ');

    let rpcUrls: string[] = [];
    if (rpcUrlInput.trim()) {
        rpcUrls = rpcUrlInput.split(',').map(url => url.trim()).filter(url => url.length > 0);
    }

    const explorerUrl = await askQuestion('Explorer URL (optional, press Enter to skip): ');
    const currencyName = await askQuestion('Currency Name (optional, press Enter to skip): ');
    const currencySymbol = await askQuestion('Currency Symbol (optional, press Enter to skip): ');

    const isActiveInput = await askQuestion('Is Active? (true/false, default: true): ');
    const isActive = isActiveInput.toLowerCase().trim() !== 'false';

    const isDefaultInput = await askQuestion('Is Default? (true/false, default: false): ');
    const isDefault = isDefaultInput.toLowerCase().trim() === 'true';

    console.log('\nContract Details (optional JSON object):');
    const contractDetails = await parseJsonInput('Enter contract details or press Enter to skip: ');

    console.log('\nExtras (optional JSON object for additional metadata):');
    const extras = await parseJsonInput('Enter extras or press Enter to skip: ');

    return {
        name: name.trim(),
        chain: chain.trim().toLowerCase(),
        chainId: chainId.trim() || undefined,
        rpcUrl: rpcUrls,
        explorerUrl: explorerUrl.trim() || undefined,
        currencyName: currencyName.trim() || undefined,
        currencySymbol: currencySymbol.trim() || undefined,
        isActive,
        isDefault,
        contractDetails: contractDetails || undefined,
        extras: extras || undefined,
    };
};

const insertChainConfig = async (config: ChainConfigInput): Promise<void> => {
    try {
        const existingName = await prismaClient.chainConfig.findFirst({
            where: { name: config.name },
        });

        if (existingName) {
            console.error(`\nError: Chain configuration with name "${config.name}" already exists.`);
            return;
        }

        const existingChain = await prismaClient.chainConfig.findFirst({
            where: { chain: config.chain, isActive: true },
        });

        if (existingChain && config.isActive) {
            console.warn(`\nWarning: Chain type "${config.chain}" already has an active configuration.`);
            const proceed = await askQuestion('Do you want to add another? (yes/no): ');
            if (proceed.toLowerCase().trim() !== 'yes') {
                return;
            }
        }

        const data: any = {
            name: config.name,
            chain: config.chain,
            rpcUrl: config.rpcUrl,
            isActive: config.isActive,
            isDefault: config.isDefault,
        };

        if (config.chainId) data.chainId = config.chainId;
        if (config.explorerUrl) data.explorerUrl = config.explorerUrl;
        if (config.currencyName) data.currencyName = config.currencyName;
        if (config.currencySymbol) data.currencySymbol = config.currencySymbol;
        if (config.contractDetails) data.contractDetails = config.contractDetails;
        if (config.extras) data.extras = config.extras;

        await prismaClient.chainConfig.create({
            data,
        });

        console.log(`\n✓ Chain configuration "${config.name}" added successfully!`);
    } catch (error) {
        console.error('\nError adding chain configuration:', error);
    }
};

const main = async () => {
    try {
        let addMore = true;

        while (addMore) {
            const config = await collectChainConfig();
            await insertChainConfig(config);

            const continueInput = await askQuestion('\nDo you want to add another chain configuration? (yes/no): ');
            addMore = continueInput.toLowerCase().trim() === 'yes';
        }

        console.log('\nChain configuration addition process completed.\n');
    } catch (error) {
        console.error('Unexpected error:', error);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
};

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
