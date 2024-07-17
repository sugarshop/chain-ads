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

  ui.write('Waiting for get ads labels...');

  const adsLabels = await chainAds.getLabels();
  
  ui.clearActionPrompt();
  ui.write('adsLabels:');
  Object.entries(adsLabels).forEach(([key, value]) => {
    ui.write(`key:  ${key} | value: ${value.join(', ')}`);
  });

  ui.write(`adsLabels get successfully`);
}
