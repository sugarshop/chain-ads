// src/tonClient.ts
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient } from "@ton/ton";

let client: TonClient;

export async function initializeTonClient() {
    try {
        const endpoint = await getHttpEndpoint({ network: "testnet" });
        client = new TonClient({ endpoint });
        console.log("TON Client initialized successfully");
    } catch (error) {
        console.error("Failed to initialize TON Client:", error);
        // use backup endpoint.
        client = new TonClient({
            endpoint: process.env.TON_ENDPOINT || 'https://toncenter.com/api/v2/jsonRPC',
        });
    }
}

export function getTonClient(): TonClient {
    if (!client) {
        throw new Error("TON Client not initialized");
    }
    return client;
}