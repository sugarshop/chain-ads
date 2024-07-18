import * as fs from "fs";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address, toNano, WalletContractV4, Cell } from "@ton/ton";
import { mnemonicToWalletKey } from "ton-crypto";
import { ChainAds } from '../wrappers/ChainAds';

export async function run() {

    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });

    const mnemonic = "biology size poverty pluck cable engine release rare salmon vessel expect avocado grief hood into result sustain strike stamp ship problem athlete cook receive"; // your 24 secret words
    const key = await mnemonicToWalletKey(mnemonic.split(" "));
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    if (!await client.isContractDeployed(wallet.address)) {
        return console.log("wallet is not deployed");
    }

    const walletContract = client.open(wallet);
    const walletSender = walletContract.sender(key.secretKey);
    const seqno = await walletContract.getSeqno();

    const chainAdsCode = Cell.fromBoc(fs.readFileSync("build/chain_ads.cell"))[0];


    const chainAds = client.open(
        ChainAds.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                counter: 0,
                inventoryAdTags: [],
                inventoryWalletAddress: "",
                budgetAdTags: [],
                budgetWalletAddress: "",
            },
            chainAdsCode
        )
    );

    await chainAds.sendDeploy(walletSender, toNano('0.05'));

    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
        console.log("waiting for deploy...");
        await sleep(1500);
        currentSeqno = await walletContract.getSeqno(); //检查钱包的序列号是否已经增加
    }
    console.log("deploy transaction confirmed!");

    //输出部署的合约地址
    console.log(`ChainAds contract deployed at address: ${chainAds.address.toString()}`);
}
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  