import { mnemonicToWalletKey } from "@ton/crypto";
import { WalletContractV4, TonClient, Sender } from "@ton/ton";
import * as dotenv from 'dotenv';

dotenv.config();

export async function createSender(client: TonClient): Promise<Sender> {
    if (!process.env.MNEMONIC) {
        throw new Error("MNEMONIC is not set in environment variables");
    }

    const mnemonic = process.env.MNEMONIC.split(' ');
    if (mnemonic.length !== 24) {
        throw new Error("Invalid mnemonic: must be 24 words");
    }

    const key = await mnemonicToWalletKey(mnemonic);
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    
    const walletAddress = wallet.address;

    // create ContractProvider
    const provider = client.provider(walletAddress);

    return wallet.sender(provider, key.secretKey);
}