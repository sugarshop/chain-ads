import { Address, toNano } from '@ton/core';
import { ChainAds } from '../wrappers/ChainAds';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
  const ui = provider.ui();

  const address = Address.parse(args.length > 0 ? args[0] : await ui.input('ChainAds Contract address'));

  if (!(await provider.isContractDeployed(address))) {
    ui.write(`Error: Contract at address ${address} is not deployed!`);
    return;
  }

  const chainAds = provider.open(ChainAds.createFromAddress(address));

  ui.write('Waiting for get inventory ads labels...');

  const adsLabels = await chainAds.getInventoryAdLabels();
  
  ui.clearActionPrompt();
  ui.write('InventoryAdsLabels:');
  Object.entries(adsLabels).forEach(([key, value]) => {
    ui.write(`key:  ${key} | value: ${value.join(', ')}`);
  });

  ui.write(`InventoryAdsLabels get successfully`);
}
