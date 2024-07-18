import express from 'express';
import { ChainAds } from './contract/ChainAds';
import dotenv from 'dotenv';
import { initializeTonClient, getTonClient } from './tonClient';
import { createSender } from './walletUtils';
import { Address, toNano } from "@ton/ton";


dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 初始化 TON Client 并启动服务器
initializeTonClient().then(async () => {

    const chainAdsAddress = Address.parse(process.env.CONTRACT_ADDRESS || "EQAF_wy0POoF3Kgbbe-27PMMk-OiVSpBZ4cVzH8SOBue_R-b");
    const chainAds = new ChainAds(chainAdsAddress);

    const client = getTonClient();
    // open chainAds instance by address
    const chainAdsContract = client.open(chainAds);

    const sender = await createSender(client);

    app.get('/counter', async (req, res) => {
        try {
            const counter = await chainAdsContract.getCounter();
            res.json({ counter: counter.toString() });
        } catch (error) {
            res.status(500).json({ error: 'Error fetching counter' });
        }
    });

    app.get('/increase', async (req, res) => {
        try {
            await chainAdsContract.sendIncrease(sender, {
                increaseBy: 1,
                value: toNano('0.05'),
            });
            res.json({ message: 'Increase request sent' });
        } catch (error) {
            res.status(500).json({ error: 'Error increasing counter' });
        }
    });

    // other router...

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}).catch(error => {
    console.error("Failed to start the server:", error);
    process.exit(1);
});