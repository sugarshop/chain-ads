import { Address, beginCell, Cell, Dictionary, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type ChainAdsConfig = {
    id: number;
    counter: number;
    inventoryAdTags?: string[];
    inventoryWalletAddress?: string;
    budgetAdTags?: string[];
    budgetWalletAddress?: string;
};

export function chainAdsConfigToCell(config: ChainAdsConfig): Cell {
    let inventoryLabelsDict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
    let budgetLabelsDict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())

    inventoryLabelsDict.set(BigInt(1), beginCell().storeStringRefTail("A").endCell())
    budgetLabelsDict.set(BigInt(2), beginCell().storeStringRefTail("A").endCell())

    return beginCell()
        .storeUint(config.id, 32)                                               // id
        .storeUint(config.counter, 32)                                          // counter
        .storeDict(inventoryLabelsDict) // inventory labels dict
        .storeDict(budgetLabelsDict) // budget labels dict
        .endCell();
}

export const Opcodes = {
    increase: 0x7e8764ef,
    uploadInventoryAds: 0xc1123d54,
    uploadBudgetAds: 0x3adb53d4,
    sendTon: 0x361b9181,
};

export class ChainAds implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new ChainAds(address);
    }

    static createFromConfig(config: ChainAdsConfig, code: Cell, workchain = 0) {
        const data = chainAdsConfigToCell(config);
        const init = { code, data };
        return new ChainAds(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendIncrease(
        provider: ContractProvider,
        via: Sender,
        opts: {
            increaseBy: number;
            value: bigint;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.increase, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeUint(opts.increaseBy, 32)
                .endCell(),
        });
    }

    async sendTon(
        provider: ContractProvider,
        via: Sender,
        opts: {
            toAddress: Address;
            amount: bigint;
            value: bigint;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.sendTon, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeAddress(opts.toAddress)
                .storeCoins(opts.amount)
                .endCell(),
        });
    }
    
    async getCounter(provider: ContractProvider) {
        const result = await provider.get('get_counter', []);
        return result.stack.readNumber();
    }

    async getID(provider: ContractProvider) {
        const result = await provider.get('get_id', []);
        return result.stack.readNumber();
    }

    async sendInventoryAds(
        provider: ContractProvider,
        via: Sender,
        opts: {
            adTags: string[];
            walletAddress: string;
            value: bigint;
            queryID?: number;
        }
    ) {
        await this.sendAds(provider, via, opts, Opcodes.uploadInventoryAds)
    }

    async getInventoryAdTags(provider: ContractProvider) {
        await this.getAdTags(provider, 'get_inventory_ad_tags')
    }

    async getInventoryWalletAddress(provider: ContractProvider) {
        const result = await provider.get('get_inventory_wallet_address', []);
        return result.stack.readString() || "";
    }

    // more readable method.
    async getInventoryAdLabels(provider: ContractProvider): Promise<{ [key: string]: string[] }> {
        return this.getLabels(provider, 'get_inventory_labels');
    }

    async sendBudgetAds(
        provider: ContractProvider,
        via: Sender,
        opts: {
            adTags: string[];
            walletAddress: string;
            value: bigint;
            queryID?: number;
        }
    ){
        await this.sendAds(provider, via, opts, Opcodes.uploadBudgetAds)
    }

    async getBudgetAdTags(provider: ContractProvider) {
        await this.getAdTags(provider, 'get_budget_tags')
    }

    async getBudgetWalletAddress(provider: ContractProvider) {
        const result = await provider.get('get_budget_address', []);
        return result.stack.readString() || "";
    }

    // more readable method.
    async getBudgetAdLabels(provider: ContractProvider): Promise<{ [key: string]: string[] }> {
        return this.getLabels(provider, 'get_budget_labels');
    }

    // basic method to get ad tags.
    async getAdTags(provider: ContractProvider, method: string) {
        const result = await provider.get(method, []);

        if (result && result.stack) {
            const cell = result.stack.readCell();
            
            return this.parseCellToStringList(cell)
        } else {
            return [];
        }
    }

    // basic upload ads method.
    async sendAds(
        provider: ContractProvider,
        via: Sender,
        opts: {
            adTags: string[];
            walletAddress: string;
            value: bigint;
            queryID?: number;
        },
        opcode: number | bigint
    ) {
        const adTagsCell = beginCell();
        for (const tag of opts.adTags) {
            // 存储 cell 引用，不存储 cell slice
            adTagsCell.storeRef(beginCell().storeStringRefTail(tag).endCell());
        }
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(opcode, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(adTagsCell.endCell())
                .storeSlice(beginCell().storeStringRefTail(opts.walletAddress).endCell().beginParse())
                .endCell(),
        });
    }
    
    // basic method to get ads labels dict {wallet_address: ads Tags}
    async getLabels(provider: ContractProvider, method: string): Promise<{ [key: string]: string[] }> {
        const labels = await this.getRawAdsLabels(provider, method);
        const readableLabels: { [key: string]: string[] } = {};

        for (const [key, value] of labels) {
            const keyString = key.toString(16).padStart(64, '0'); // to HEX String
            const valueStringList = this.parseCellToStringList(value); // assume Cell stored type is String.
            readableLabels[keyString] = valueStringList;
        }

        return readableLabels;
    }

    // basic method to get raw ads lebels.
    async getRawAdsLabels(provider: ContractProvider, method: string): Promise<Dictionary<bigint, Cell>> {
        const result = await provider.get(method, []);
        
        if (!result || !result.stack || result.stack.remaining <= 0) {
            return Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
        }
        const dictCell = result.stack.readCell();
        
        // create a Dictionary
        const dict = Dictionary.loadDirect(
            Dictionary.Keys.BigUint(256), // BigUint(256) Type
            Dictionary.Values.Cell(),       // Cell Type
            dictCell
        );

        return dict;
    }

    parseCellToStringList(cell: Cell): string[] {
        const adTags = [];

        let slice = cell.beginParse();
        while (slice.remainingRefs > 0) {
            const tag = slice.loadStringRefTail();
            adTags.push(tag);
        }
        return adTags;
    }

    async getAddressesByLables(provider: ContractProvider, lables: string[], logic: 'AND' | 'OR' = 'OR'): Promise<string[]> {
        const labels = await this.getLabels(provider);
        const addresses: string[] = [];
    
        for (const [address, addressLables] of Object.entries(labels)) {
            if (logic === 'AND') {
                if (lables.every(lables => addressLables.includes(lables))) {
                    addresses.push(address);
                }
            } else { // OR logic
                if (lables.some(lables => addressLables.includes(lables))) {
                    addresses.push(address);
                }
            }
        }
    
        return addresses;
    }
}