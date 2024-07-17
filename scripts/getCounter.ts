import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address } from "@ton/ton";
import { ChainAds } from '../wrappers/ChainAds';

export async function run() {
  // initialize ton rpc client on testnet
  const endpoint = await getHttpEndpoint({ network: "testnet" });
  const client = new TonClient({ endpoint });

  // open Counter instance by address
  const counterAddress = Address.parse("EQDFz1DPgwRMRu25fCUhrgK2ANOAliHHqqWXWzgUUlTTBriU");
  const counter = new ChainAds(counterAddress);
  const counterContract = client.open(counter); 

  // call the getter on chain
  const counterValue = await counterContract.getCounter();
  console.log("value:", counterValue.toString());
}
