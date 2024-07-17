import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import TonWeb from 'tonweb';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    
    const testTonweb = new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC'));
    const mainTonweb = new TonWeb();

    const addressString = args.length > 0 ? args[0] : await ui.input('Enter address');
    const address = Address.parse(addressString);

    const testBalance = await testTonweb.getBalance(addressString);
    const mainBalance = await mainTonweb.getBalance(addressString);
    ui.write(`address: ${address.toString()} \ntestNetBalance: ${TonWeb.utils.fromNano(testBalance)} TON\n`);
    ui.write('mainNetBalance: ' + TonWeb.utils.fromNano(mainBalance) + ' TON');

}