import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address, toNano, WalletContractV4 } from "@ton/ton";
import { mnemonicToWalletKey } from "ton-crypto";
import { ChainAds } from '../wrappers/ChainAds';

export async function run(args: string[]) {

    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });
    
    const recipientAddress = Address.parse("EQCdLgVDF0nFhcDNeQJZd7TIUthR_rQIJVpYlmqtZj6NV9K_");

    if (!(await client.isContractDeployed(recipientAddress))) {
        console.log(`Error: Contract at address ${recipientAddress} is not deployed!`);
        return;
    }

    // get contract address
    const chainAds = client.open(ChainAds.createFromAddress(Address.parse(recipientAddress.toString())));

    const amount = "0.06";//input

    const mnemonic = "biology size poverty pluck cable engine release rare salmon vessel expect avocado grief hood into result sustain strike stamp ship problem athlete cook receive"; // your 24 secret words
    const key = await mnemonicToWalletKey(mnemonic.split(" "));
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    if (!await client.isContractDeployed(wallet.address)) {
        return console.log("wallet is not deployed");
    }

    const walletContract = client.open(wallet);
    const walletSender = walletContract.sender(key.secretKey);


    // transfer amount to nano
    const amountNano = toNano(amount);

    // set gas fee
    const gasFee = BigInt(Math.max(Number(amountNano) / 10, 0.1 * 1e9));
    const totalValue = amountNano + gasFee;

    // send TON
    await chainAds.sendTon(walletSender, {
        toAddress: recipientAddress,
        amount: amountNano,
        value: totalValue,
    });

    console.log(`Successfully sent ${amount} TON to ${recipientAddress.toString()}`);

}