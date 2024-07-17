import { Address, beginCell, Cell, Dictionary, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type ChainAdsConfig = {
    id: number;
    counter: number;
    adTags?: string;
    walletAddress?: string;
};

export function chainAdsConfigToCell(config: ChainAdsConfig): Cell {
    return beginCell()
        .storeUint(config.id, 32)
        .storeUint(config.counter, 32)
        .storeRef(beginCell().storeStringTail("").endCell())
        .storeRef(beginCell().storeStringTail("").endCell()) 
        .endCell();
}

export const Opcodes = {
    increase: 0x7e8764ef,
    uploadAd: 0x55b6ede3,
    sendTon: 0x423ce057,
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

    async sendUploadAd(
        provider: ContractProvider,
        via: Sender,
        opts: {
            adTags: string[];
            walletAddress: string;
            value: bigint;
            queryID?: number;
        }
    ){
        const adTagsCell = beginCell();
        for (const tag of opts.adTags) {
            adTagsCell.storeSlice(beginCell().storeStringRefTail(tag).endCell().beginParse());
        }
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.uploadAd, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(adTagsCell.endCell())
                .storeSlice(beginCell().storeStringRefTail(opts.walletAddress).endCell().beginParse())
                .endCell(),
        });
    }

    async getAdTags(provider: ContractProvider) {
        const result = await provider.get('get_ad_tags', []);

        if (result && result.stack) {
            const cell = result.stack.readCell();
            
            return this.parseCellToStringList(cell)
        } else {
            return [];
        }
    }

    async getWalletAddress(provider: ContractProvider) {
        const result = await provider.get('get_wallet_address', []);
        return result.stack.readString() || "";
    }

    async getRawAdsLabels(provider: ContractProvider): Promise<Dictionary<bigint, Cell>> {
        const result = await provider.get('get_labels', []);
        const dictCell = result.stack.readCell();

        // create a Dictionary
        const dict = Dictionary.loadDirect(
            Dictionary.Keys.BigUint(256), // BigUint(256) Type
            Dictionary.Values.Cell(),       // Cell Type
            dictCell
        );

        return dict;
    }

    // more readable method.
    async getLabels(provider: ContractProvider): Promise<{ [key: string]: string[] }> {
        const labels = await this.getRawAdsLabels(provider);
        const readableLabels: { [key: string]: string[] } = {};

        for (const [key, value] of labels) {
            const keyString = key.toString(16).padStart(64, '0'); // to HEX String
            const valueStringList = this.parseCellToStringList(value); // assume Cell stored type is String.
            readableLabels[keyString] = valueStringList;
        }

        return readableLabels;
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
}