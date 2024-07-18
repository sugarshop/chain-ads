import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address, toNano, WalletContractV4 } from "@ton/ton";
import { mnemonicToWalletKey } from "ton-crypto";
import { ChainAds } from '../wrappers/ChainAds';

export async function run(args: string[]) {
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });

    const address = Address.parse("EQCdLgVDF0nFhcDNeQJZd7TIUthR_rQIJVpYlmqtZj6NV9K_");

    if (!(await client.isContractDeployed(address))) {
        console.log(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const chainAds = client.open(ChainAds.createFromAddress(address));

    const counterBefore = await chainAds.getCounter();

    const mnemonic = "biology size poverty pluck cable engine release rare salmon vessel expect avocado grief hood into result sustain strike stamp ship problem athlete cook receive"; // your 24 secret words
    const key = await mnemonicToWalletKey(mnemonic.split(" "));
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    if (!await client.isContractDeployed(wallet.address)) {
        return console.log("wallet is not deployed");
    }

    const walletContract = client.open(wallet);
    const walletSender = walletContract.sender(key.secretKey);

    const walletAddress = walletSender.toString();

    await chainAds.sendIncrease(walletSender, {
        increaseBy: 1,
        value: toNano('0.05'),
    });
    
    let counterAfter = await chainAds.getCounter();

    console.log(`Waiting for counter to increase..., counterBefore ${counterBefore}.`);

    let attempt = 1;
    while (counterAfter === counterBefore) {
        console.log(`Attempt ${attempt}: Counter hasn't increased yet. Waiting...`);
        counterAfter = await chainAds.getCounter();
        attempt++;
        sleep(150)
    }

    console.log(`Counter increased successfully! counterAfter ${counterAfter}`);
}
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
