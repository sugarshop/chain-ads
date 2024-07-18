import express from 'express';
import path from 'path';
import { ChainAds } from './contract/ChainAds';
import dotenv from 'dotenv';
import { initializeTonClient, getTonClient } from './tonClient';
import { createSender } from './walletUtils';
import { Address, toNano } from "@ton/ton";


dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 初始化 TON Client 并启动服务器
initializeTonClient().then(async () => {

    const chainAdsAddress = Address.parse(process.env.CONTRACT_ADDRESS || "EQAF_wy0POoF3Kgbbe-27PMMk-OiVSpBZ4cVzH8SOBue_R-b");
    const chainAds = new ChainAds(chainAdsAddress);

    const client = getTonClient();
    // open chainAds instance by address
    const chainAdsContract = client.open(chainAds);

    const sender = await createSender(client);

    const tagUrlMap: { [key: string]: string } = {
        food: 'https://www.sheknows.com/food-and-recipes/slideshow/9035/los-angeles-food-trends/',
        camera: 'https://www.freepik.es/fotos-premium/ilustracion-camara_62732202.htm',
        women_dress: 'https://www.thedressoutlet.com/products/fitted-off-shoulder-long-slit-prom-dress?variant=39755767087165&pins_campaign_id=626752536343&pp=0&epik=dj0yJnU9ZzFGa0g5Q29hNFlab0lvc2wwNG45S0N1bnhuNVRwc2MmcD0xJm49WEEtUnZybkhfTWY2bDBIc3pwSFdrUSZ0PUFBQUFBR2FaS0Vv'
    };

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

    app.get('/uploadInventoryAds', (req, res) => {
        res.send(`
            <form action="/uploadInventoryAds" method="POST">
                <label for="adTags">Enter ad tags (separated by space):</label>
                <input type="text" id="adTags" name="adTags" required>
                <button type="submit">Upload</button>
            </form>
        `);
    });

    app.post('/uploadInventoryAds', async (req, res) => {
        try {
            const adTagsInput = req.body.adTags;
            const adTags = adTagsInput.trim().split(/\s+/);
            
            if (adTags.length === 0) {
                return res.status(400).send('Please provide at least one ad tag.');
            }
            const inventoryWalletAddress = sender.toString();

            await chainAdsContract.sendInventoryAds(sender, {
                adTags: adTags,
                walletAddress: inventoryWalletAddress,
                value: toNano('0.05'),
            });

            res.send(`
                <h2>Inventory ads uploaded successfully!</h2>
                <p>Tags: ${adTags.join(', ')}</p>
                <p>Contract Address: ${inventoryWalletAddress}</p>
            `);
        } catch (error) {
            console.error('Error uploading inventory ads:', error);
            res.status(500).send('Error uploading inventory ads');
        }
    });

    app.get('/uploadBudgetAds', (req, res) => {
        res.send(`
            <form action="/uploadBudgetAds" method="POST">
                <label for="adTags">Enter ad tags (separated by space):</label>
                <input type="text" id="adTags" name="adTags" required>
                 <label for="url">Enter URL for the tag:</label>
                <input type="url" id="url" name="url" required><br><br>
                <button type="submit">Upload</button>
            </form>
        `);
    });

    app.post('/uploadBudgetAds', async (req, res) => {
        try {
            const adTagsInput = req.body.adTags;
            const url = req.body.url;
            const adTags = adTagsInput.trim().split(/\s+/);
            
            if (adTags.length === 0) {
                return res.status(400).send('Please provide at least one ad tag.');
            }
            console.log("adTags:", adTags);
            const inventoryWalletAddress = chainAdsAddress.toString();

            await chainAdsContract.sendBudgetAds(sender, {
                adTags: adTags,
                walletAddress: inventoryWalletAddress,
                value: toNano('0.05'),
            });

            if (adTags.length > 0) {
                for (const tag of adTags) {
                    tagUrlMap[tag] = url;
                }
            }

            res.send(`
                <h2>Inventory ads uploaded successfully!</h2>
                <p>Tags: ${adTags.join(', ')}</p>
                <p>Contract Address: ${inventoryWalletAddress}</p>
            `);
        } catch (error) {
            console.error('Error uploading inventory ads:', error);
            res.status(500).send('Error uploading inventory ads');
        }
    });

    app.get('/pullAds', (req, res) => {
        res.send(`
            <form action="/pullAds" method="POST">
                <label for="tags">Enter tags (separated by space):</label>
                <input type="text" id="tags" name="tags" required><br><br>
                <label for="logic">Select logic:</label>
                <select id="logic" name="logic">
                    <option value="OR">OR</option>
                    <option value="AND">AND</option>
                </select><br><br>
                <button type="submit">Pull Ads</button>
            </form>
        `);
    });

    app.post('/pullAds', async (req, res) => {
        try {
            const tags = req.body.tags.split(' ').map((tag: string) => tag.trim()).filter((tag: string) => tag !== '');
            const logic = req.body.logic as 'AND' | 'OR';
    
            if (tags.length === 0) {
                return res.status(400).send('Please provide at least one tag.');
            }
    
            const result = await chainAdsContract.getBudgetAddressesByTags(tags, logic);
    
            let htmlContent = `<h2>Budget Addresses by Tags</h2>`;
            htmlContent += `<p>Tags: ${tags.join(', ')}</p>`;
            htmlContent += `<p>Logic: ${logic}</p>`;
            htmlContent += '<table border="1"><tr><th>Tag</th><th>Addresses</th></tr>';
    
            let totalUniqueAddresses = new Set<string>();
    
            for (const [tag, addresses] of Object.entries(result)) {
                let displayAddresses: string[];
                if (tag in tagUrlMap) {
                    displayAddresses = [tagUrlMap[tag as keyof typeof tagUrlMap]];
                } else {
                    displayAddresses = addresses;
                }
                
                if(addresses && addresses.length > 0) {
                    htmlContent += `<tr><td>${tag}</td><td>${displayAddresses.map(address => `<a href="${address}" target="_blank">${address}</a>`).join('<br>')}</td></tr>`;
                }
                addresses.forEach(address => totalUniqueAddresses.add(address));
            }
    
            htmlContent += '</table>';
            htmlContent += `<p>Total unique addresses: ${totalUniqueAddresses.size}</p>`;
    
            res.send(htmlContent);
        } catch (error) {
            console.error('Error fetching budget addresses by tags:', error);
            res.status(500).send('Error fetching budget addresses by tags');
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