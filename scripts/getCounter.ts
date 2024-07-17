import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address } from "@ton/ton";
import { ChainAds } from '../wrappers/ChainAds';

export async function run() {
  // initialize ton rpc client on testnet
  const endpoint = await getHttpEndpoint({ network: "testnet" });
  const client = new TonClient({ endpoint });

  // open Counter instance by address
  const counterAddress = Address.parse("EQBEIY4US7qBH4vpHH5r-Ji97VUjjm5SQhSFCjqBqwr45ZIE"); // replace with your address from step 8
  const counter = new ChainAds(counterAddress);
  const counterContract = client.open(counter); 

  // call the getter on chain
  const counterValue = await counterContract.getCounter();
  console.log("value:", counterValue.toString());
}
