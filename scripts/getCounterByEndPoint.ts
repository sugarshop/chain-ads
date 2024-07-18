import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address } from "@ton/ton";
import { ChainAds } from "../wrappers/ChainAds"; // this is the interface class we just implemented

export async function run() {
  // initialize ton rpc client on testnet
  const endpoint = await getHttpEndpoint({ network: "testnet" });
  const client = new TonClient({ endpoint });

  // open Counter instance by address
  const chainAdsAddress = Address.parse("EQAF_wy0POoF3Kgbbe-27PMMk-OiVSpBZ4cVzH8SOBue_R-b"); // replace with your address from step 8
  const chainAds = new ChainAds(chainAdsAddress);
  const chainAdsContract = client.open(chainAds);

  // call the getter on chain
  const counterValue = await chainAdsContract.getCounter();
  console.log("value:", counterValue.toString());
}