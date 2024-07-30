import * as fs from 'fs/promises';
import readline from 'readline';
import { createWalletClient, defineChain, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';


const gnacheAccounts = `${__dirname}/../../accounts.json`;
const ethAmount = parseEther('1');

const localChain = {
    id: Number(process.env.CHAIN_ID) || 8888,
    name: 'Rahat',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: {
            http: [
                process.env.NETWORK_PROVIDER || 'http://localhost:8888'
            ],
        },
    },
}

async function getAccounts(): Promise<{ addresses: `0x${string}`[], privateKeys: `0x${string}`[] }> {
    const accounts = await fs.readFile(gnacheAccounts, 'utf-8');
    const ganacheData = JSON.parse(accounts)
    const addresses = Object.values(ganacheData.addresses) as `0x${string}`[];
    const privateKeys = Object.values(ganacheData.private_keys) as `0x${string}`[];
    return {
        addresses,
        privateKeys
    }
}

const sendToken = async (to: `0x${string}`) => {
    try {
        const rahatChain = defineChain(localChain);
        const { privateKeys } = await getAccounts();
        const client = createWalletClient({
            chain: rahatChain,
            transport: http()
        })
        const tx = await client.sendTransaction({
            account: privateKeyToAccount(privateKeys[0]),
            to,
            value: ethAmount
        })
        console.log(tx)
    }
    catch (e) {
        console.error(e)
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Please enter the address to transfer test ether: ', async (userAddress) => {
    await sendToken(userAddress as `0x${string}`);
    console.log(`Successfully sent ${ethAmount} ETH to:`, userAddress);
    rl.close();
});

