import { Address, toNano } from '@ton/core';
import { ChainAds } from '../wrappers/ChainAds';
import { NetworkProvider, sleep } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('ChainAds address'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const chainAds = provider.open(ChainAds.createFromAddress(address));

    const counterBefore = await chainAds.getCounter();

    await chainAds.sendIncrease(provider.sender(), {
        increaseBy: 1,
        value: toNano('0.05'),
    });
    
    let counterAfter = await chainAds.getCounter();

    ui.write(`Waiting for counter to increase..., counterBefore ${counterBefore}.`);

    let attempt = 1;
    while (counterAfter === counterBefore) {
        ui.setActionPrompt(`Attempt ${attempt}`);
        await sleep(2000);
        counterAfter = await chainAds.getCounter();
        attempt++;
    }

    ui.clearActionPrompt();
    ui.write(`Counter increased successfully! counterAfter ${counterAfter}`);
}
