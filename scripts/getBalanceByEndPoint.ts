import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address } from "@ton/ton";
import TonWeb from 'tonweb';

export async function run(args: string[]) {
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });
    
    const testTonweb = new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC'));
    const mainTonweb = new TonWeb();

    const addressString = Address.parse("EQAF_wy0POoF3Kgbbe-27PMMk-OiVSpBZ4cVzH8SOBue_R-b").toString(); ;
    const address = Address.parse(addressString);

    const testBalance = await testTonweb.getBalance(addressString);
    const mainBalance = await mainTonweb.getBalance(addressString);
    console.log(`address: ${address.toString()} \ntestNetBalance: ${TonWeb.utils.fromNano(testBalance)} TON\n`);
    console.log('mainNetBalance: ' + TonWeb.utils.fromNano(mainBalance) + ' TON');

}