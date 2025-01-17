import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { ChainAds } from '../wrappers/ChainAds';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    
    const recipientAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('Enter the recipient address:'));

    if (!(await provider.isContractDeployed(recipientAddress))) {
        ui.write(`Error: Contract at address ${recipientAddress} is not deployed!`);
        return;
    }

    // get contract address
    const chainAds = provider.open(ChainAds.createFromAddress(Address.parse(recipientAddress.toString())));

    const amount = args.length > 1 ? args[1] : await ui.input('Enter the amount of TON to deposit:');


    // transfer amount to nano
    const amountNano = toNano(amount);

    // set gas fee
    const gasFee = BigInt(Math.max(Number(amountNano) / 10, 0.1 * 1e9));
    const totalValue = amountNano + gasFee;

    // send TON
    await chainAds.sendTon(provider.sender(), {
        toAddress: recipientAddress,
        amount: amountNano,
        value: totalValue,
    });

    ui.write(`Successfully sent ${amount} TON to ${recipientAddress.toString()}`);

}