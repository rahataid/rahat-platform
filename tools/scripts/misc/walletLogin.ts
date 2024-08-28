import axios from "axios";
import dotenv from 'dotenv';
import { privateKeyToAccount } from 'viem/accounts';
dotenv.config({ path: `${__dirname}/.env.misc` });

const baseUrl = "http://localhost:5500/v1";
const privateKey = process.env.PRIVATE_KEY as `0x${string}`;

const getWalletChallenge = async () => {
    const response = await axios.post(`${baseUrl}/auth/challenge`);
    return response.data;
}

const signMessage = async (message: string) => {
    const account = privateKeyToAccount(privateKey)
    const signature = await account.signMessage({
        message,
    })
    return signature;
}

const loginByWallet = async (challenge: string, signature: string) => {
    const response = await axios.post(`${baseUrl}/auth/wallet`, {
        challenge,
        signature
    });

    return response.data;
}

const main = async () => {
    const challenge = await getWalletChallenge();
    const signature = await signMessage(challenge.data.challenge);
    const data = await loginByWallet(challenge.data.challenge, signature);
    console.log("Login success", data);
}

(async () => {
    await main();
    process.exit(0);
})();