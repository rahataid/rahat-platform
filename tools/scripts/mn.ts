import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { ethers } from 'ethers';
import * as fs from 'fs/promises';

const mn = bip39.generateMnemonic(wordlist);
const mnemonicWallet = ethers.Wallet.fromPhrase(mn);
const privateKey = mnemonicWallet.privateKey;

const rootPath = process.argv[2]
const rootEnv = `${rootPath}/.env`
const devToolsEnv = `${rootPath}/tools/docker-compose/dev-tools/.env`


modifyDevToolsEnv()
modifyRootEnv()

async function modifyDevToolsEnv() {
    try {
        let data = await fs.readFile(devToolsEnv, 'utf8');
        const lines = data.split('\n') as string[];

        const newLines = lines.map(line => {
            if (line.startsWith('MNEMONIC')) {
                return `MNEMONIC=${mn}`;
            }
            return line;
        });

        const newData = newLines.join('\n');

        await fs.writeFile(devToolsEnv, newData, 'utf8');

        console.log(devToolsEnv)
        console.log('File updated.');
    } catch (error) {
        console.error('Error modifying dev-tools .env file:', error);
    }
}

async function modifyRootEnv() {
    try {
        let data = await fs.readFile(rootEnv, 'utf8');
        const lines = data.split('\n') as string[];

        const newLines = lines.map(line => {
            if (line.startsWith('PRIVATE_KEY')) {
                return `PRIVATE_KEY=${privateKey}`;
            }
            return line;
        });

        const newData = newLines.join('\n');

        await fs.writeFile(rootEnv, newData, 'utf8');

        console.log(rootEnv)
        console.log('File updated.');
    } catch (error) {
        console.error('Error modifying dev-tools .env file:', error);
    }
}

