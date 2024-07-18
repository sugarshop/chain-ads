import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address, toNano, WalletContractV4 } from "@ton/ton";
import { mnemonicToWalletKey } from "ton-crypto";
import { ChainAds } from '../wrappers/ChainAds';

export async function run() {
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });

    const address = Address.parse("EQCdLgVDF0nFhcDNeQJZd7TIUthR_rQIJVpYlmqtZj6NV9K_");

    if (!(await client.isContractDeployed(address))) {
        console.log(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    console.log('Opening contract...');
    const chainAds = client.open(ChainAds.createFromAddress(address));
    
    // ad tags: [A ~ Z]
    const adTagsInput: string = "A C"; //input

    const mnemonic = "biology size poverty pluck cable engine release rare salmon vessel expect avocado grief hood into result sustain strike stamp ship problem athlete cook receive"; // your 24 secret words
    const key = await mnemonicToWalletKey(mnemonic.split(" "));
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    if (!await client.isContractDeployed(wallet.address)) {
        return console.log("wallet is not deployed");
    }

    const walletContract = client.open(wallet);
    const walletSender = walletContract.sender(key.secretKey);

    const walletAddress = walletSender.toString();

    // seperate tags by space
    const adTags: string[] = adTagsInput.trim().split(/\s+/);
    
    console.log('Ad Tags: ' + adTags.join(', '));

    console.log('Waiting for ad tags and wallet address uploaded...');
    await chainAds.sendBudgetAds(walletSender, {
        adTags,
        walletAddress,
        value: toNano('0.05'),
    }, )

    console.log('ad tags and wallet address uploaded successfully!');
}
