import * as fs from "fs";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient, WalletContractV4, toNano } from "@ton/ton";
import { ChainAds } from '../wrappers/ChainAds';
import { compile } from '@ton/blueprint';

export async function run() {
  // 初始化 TonClient，连接到 testnet
  const endpoint = await getHttpEndpoint({ network: "testnet" });
  const client = new TonClient({ endpoint });

  // 准备 ChainAds 的初始代码和数据单元以进行部署
  const chainAdsCode = await compile('ChainAds');
  const chainAds = ChainAds.createFromConfig(
    {
      id: Math.floor(Math.random() * 10000),
      counter: 0,
    },
    chainAdsCode
  );

  // 检查合约是否已经部署
  console.log("contract address:", chainAds.address.toString());
  if (await client.isContractDeployed(chainAds.address)) {
    return console.log("ChainAds already deployed");
  }

  // 从环境变量获取助记词
  const mnemonic: string = process.env.WALLET_MNEMONIC || '';
  if (!mnemonic) {
      console.log('Error: WALLET_MNEMONIC not set in environment variables');
      return;
  }

  // 打开钱包 v4
  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
  if (!await client.isContractDeployed(wallet.address)) {
    return console.log("wallet is not deployed");
  }

  // 打开钱包并读取当前序列号
  const walletContract = client.open(wallet);
  const walletSender = walletContract.sender(key.secretKey);
  const seqno = await walletContract.getSeqno();
  

  // 发送部署交易
  const chainAdsContract = client.open(chainAds);
  await chainAdsContract.sendDeploy(walletSender, toNano('0.05'));

  // 等待确认
  let currentSeqno = seqno;
  while (currentSeqno == seqno) {
    console.log("waiting for deploy transaction to confirm...");
    await sleep(1500);
    currentSeqno = await walletContract.getSeqno();
  }
  console.log("deploy transaction confirmed!");

  // 获取并打印 ID
  console.log('ID', await chainAdsContract.getID());
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}