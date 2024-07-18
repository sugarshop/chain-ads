import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address } from "@ton/ton";
import { ChainAds } from '../wrappers/ChainAds';

export async function run() {
  const endpoint = await getHttpEndpoint({ network: "testnet" });
  const client = new TonClient({ endpoint });

  const address = Address.parse("EQCdLgVDF0nFhcDNeQJZd7TIUthR_rQIJVpYlmqtZj6NV9K_");

  if (!(await client.isContractDeployed(address))) {
    console.log(`Error: Contract at address ${address} is not deployed!`);
    return;
  }

  const chainAds = client.open(ChainAds.createFromAddress(address));

  console.log('Waiting for get budget ads labels...');

  const adsLabels = await chainAds.getBudgetAdLabels();
  
  console.log('BudgetAdsLabels:');
  Object.entries(adsLabels).forEach(([key, value]) => {
    console.log(`key:  ${key} | value: ${value.join(', ')}`);
  });

  console.log(`BudgetAdsLabels get successfully`);
}
