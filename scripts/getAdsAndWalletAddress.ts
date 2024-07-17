import { Address, toNano } from '@ton/core';
import { ChainAds } from '../wrappers/ChainAds';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('ChainAds Contract address'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    ui.write('Opeing contract...');
    const chainAds = provider.open(ChainAds.createFromAddress(address));

    ui.write('Waiting for get Ad tags address...');

    const uploadedAdTags = await chainAds.getAdTags();
    ui.write(`Ad Tags: ${uploadedAdTags}`);

    ui.write('Waiting for get wallet address...');
    const uploadedWalletAddress = await chainAds.getWalletAddress();
    ui.write(`Wallet Address: ${uploadedWalletAddress}`);

    ui.clearActionPrompt();
    ui.write('Ad tags and wallet address get successfully!');
}
