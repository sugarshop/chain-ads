import { toNano, Dictionary } from '@ton/core';
import { ChainAds } from '../wrappers/ChainAds';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const chainAds = provider.open(
        ChainAds.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                counter: 0,
                inventoryAdTags: [],
                inventoryWalletAddress: "",
                budgetAdTags: [],
                budgetWalletAddress: "",
            },
            await compile('ChainAds')
        )
    );

    await chainAds.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(chainAds.address);

    console.log('ID', await chainAds.getID());
}