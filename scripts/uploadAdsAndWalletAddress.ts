import { Address, toNano } from '@ton/core';
import { ChainAds } from '../wrappers/ChainAds';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('ChainAds address'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    ui.write('Opeing contract...');
    const chainAds = provider.open(ChainAds.createFromAddress(address));
    
    // ad tags: [A ~ Z]
    const adTags: string = await ui.input('Enter ad tags:');
    const walletAddress: string = await ui.input('Enter DApp wallet address:');

    ui.write('Waiting for Ad tags and wallet address uploaded...');
    await chainAds.sendUploadAd(provider.sender(), {
        adTags,
        walletAddress,
        value: toNano('0.05'),
    })

    ui.write('Ad tags and wallet address uploaded successfully!');

    ui.write('Waiting for get Ad tags and wallet address...');

    const uploadedAdTags = await chainAds.getAdTags();
    
    const uploadedWalletAddress = await chainAds.getWalletAddress();

    ui.write(`Uploaded Ad Tags: ${uploadedAdTags}`);
    ui.write(`Uploaded Wallet Address: ${uploadedWalletAddress}`);

    ui.clearActionPrompt();
    ui.write('Ad tags and wallet address get successfully!');
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}