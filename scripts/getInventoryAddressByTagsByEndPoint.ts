import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address } from "@ton/ton";
import { ChainAds } from '../wrappers/ChainAds';

export async function run(args: string[]) {

    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });

    const address = Address.parse("EQCdLgVDF0nFhcDNeQJZd7TIUthR_rQIJVpYlmqtZj6NV9K_");

    if (!(await client.isContractDeployed(address))) {
        console.log(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    console.log('Opening contract...');
    const chainAds = client.open(ChainAds.createFromAddress(address));

    let lables: string[];
    if (args.length > 1) {
        lables = args.slice(1);
    } else {
        const lablesInput =  "A C"; //input
        lables = lablesInput.split(' ').map(tag => tag.trim());
    }

    let logic: string;
    if(lables.length === 0) {
        console.log(`No lables provided.`);
        return;
    }else if(lables.length === 1) {
        logic = 'AND';
    } else{
        logic = 'OR'; //input
    }
    
    console.log(`Searching for addresses with lables: ${lables.join(', ')} using ${logic} logic`);
    const result = await chainAds.getInventoryAddressesByTags(lables, logic as 'AND' | 'OR');

    let totalAddresses = 0;
    if (logic === 'AND') {
        const combinedTag = lables.join(' and ');
        const addresses = result[lables[0]] || [];
        if (addresses.length > 0) {
            console.log(`\nTag: ${combinedTag}`);
            console.log(`Addresses:`);
            addresses.forEach((addr, index) => {
                console.log(`  ${index + 1}. ${addr}`);
            });
            totalAddresses = addresses.length;
        } else {
            console.log(`\nTag: ${combinedTag}`);
            console.log(`  No addresses found for this combined tag.`);
        }
    } else {
        for (const [tag, addresses] of Object.entries(result)) {
            if (addresses.length > 0) {
                console.log(`\nTag: ${tag}`);
                console.log(`Addresses:`);
                addresses.forEach((addr, index) => {
                    console.log(`  ${index + 1}. ${addr}`);
                });
                totalAddresses += addresses.length;
            } else {
                console.log(`\nTag: ${tag}`);
                console.log(`  No addresses found for this tag.`);
            }
        }
    }


    if (totalAddresses === 0) {
        console.log(`\nNo addresses found with the specified tags and logic.`);
    } else {
        console.log(`\nTotal unique addresses found: ${totalAddresses}`);
    }
}