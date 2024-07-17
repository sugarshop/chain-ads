import { Address } from '@ton/core';
import { ChainAds } from '../wrappers/ChainAds';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    // 解析合约地址，如果没有提供，则提示用户输入
    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('ChainAds address'));

    // 检查合约是否已部署
    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    ui.write('Opening contract...');
    const chainAds = provider.open(ChainAds.createFromAddress(address));

    ui.write('Fetching ad tags...');
    
    const adTags = await chainAds.getAdTags();

    if (adTags) {
        ui.write(`Ad Tags: ${adTags}`);
    } else {
        ui.write('No ad tags found for this address.');
    }

    ui.write('Operation completed.');
}