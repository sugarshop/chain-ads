import { Address, toNano } from '@ton/core';
import { ChainAds } from '../wrappers/ChainAds';
import { TonClient } from '@ton/ton';
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import { WalletContractV4 } from "@ton/ton";
import dotenv from 'dotenv';

dotenv.config();  // 加载 .env 文件

export async function run(args: string[]) {
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });

    const ui = {
        write: (text: string) => console.log(text),
        input: async (prompt: string): Promise<string> => {
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            return new Promise((resolve) => {
                readline.question(prompt + ': ', (answer: string) => {
                    readline.close();
                    resolve(answer);
                });
            });
        }
    };

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('ChainAds address'));

    if (!(await client.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const chainAds = new ChainAds(address);

    const adTags: string = await ui.input('Enter ad tags');
    const walletAddress: string = await ui.input('Enter wallet address');

    // 从环境变量获取助记词
    const mnemonic: string = process.env.WALLET_MNEMONIC || '';
    if (!mnemonic) {
        ui.write('Error: WALLET_MNEMONIC not set in environment variables');
        return;
    }

    const key = await mnemonicToWalletKey(mnemonic.split(" "));
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    const walletContract = client.open(wallet);
    const walletSender = walletContract.sender(key.secretKey);

    try {
        await chainAds.sendUploadAd(client.provider(address), walletSender, {
            adTags,
            walletAddress,
            value: toNano('0.05'),
        });

        ui.write('Ad tags and wallet address uploaded successfully!');

        ui.write('Waiting for transaction confirmation...');
        await sleep(10000);

        const uploadedAdTags = await chainAds.getAdTags(client.provider(address));
        const uploadedWalletAddress = await chainAds.getWalletAddress(client.provider(address));

        ui.write(`Uploaded Ad Tags: ${uploadedAdTags}`);
        ui.write(`Uploaded Wallet Address: ${uploadedWalletAddress}`);

    } catch (error) {
        ui.write(`Error: Failed to upload ad. ${error}`);
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}