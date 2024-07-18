import { Address } from '@ton/core';
import { ChainAds } from '../wrappers/ChainAds';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('ChainAds Contract address'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    ui.write('Opening contract...');
    const chainAds = provider.open(ChainAds.createFromAddress(address));

    let lables: string[];
    if (args.length > 1) {
        lables = args.slice(1);
    } else {
        const lablesInput = await ui.input('Enter lables to search for (separated by space):');
        lables = lablesInput.split(' ').map(tag => tag.trim());
    }

    let logic: string;
    if(lables.length === 0) {
        ui.write(`No lables provided.`);
        return;
    }else if(lables.length === 1) {
        logic = 'AND';
    } else{
        logic = await ui.choose('Select search logic:', ['AND', 'OR'], (v: string) => v);
    }
    
    ui.write(`Searching for addresses with lables: ${lables.join(', ')} using ${logic} logic`);
    const result = await chainAds.getInventoryAddressesByTags(lables, logic as 'AND' | 'OR');

    let totalAddresses = 0;
    if (logic === 'AND') {
        const combinedTag = lables.join(' and ');
        const addresses = result[lables[0]] || [];
        if (addresses.length > 0) {
            ui.write(`\nTag: ${combinedTag}`);
            ui.write(`Addresses:`);
            addresses.forEach((addr, index) => {
                ui.write(`  ${index + 1}. ${addr}`);
            });
            totalAddresses = addresses.length;
        } else {
            ui.write(`\nTag: ${combinedTag}`);
            ui.write(`  No addresses found for this combined tag.`);
        }
    } else {
        for (const [tag, addresses] of Object.entries(result)) {
            if (addresses.length > 0) {
                ui.write(`\nTag: ${tag}`);
                ui.write(`Addresses:`);
                addresses.forEach((addr, index) => {
                    ui.write(`  ${index + 1}. ${addr}`);
                });
                totalAddresses += addresses.length;
            } else {
                ui.write(`\nTag: ${tag}`);
                ui.write(`  No addresses found for this tag.`);
            }
        }
    }


    if (totalAddresses === 0) {
        ui.write(`\nNo addresses found with the specified tags and logic.`);
    } else {
        ui.write(`\nTotal unique addresses found: ${totalAddresses}`);
    }

    ui.clearActionPrompt();
}