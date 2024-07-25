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
app.use(express.urlencoded({ extended: true }));

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
                <a href="/uploadInventoryAds">Upload more</a>
            `);
        } catch (error) {
            console.error('Error uploading inventory ads:', error);
            res.status(500).send('Error uploading inventory ads');
        }
    });

    app.post('/uploadInventoryAdsTags', async (req, res) => {
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

            // return success message.
            res.status(200).json({
                success: true,
                message: 'success',
                data: {
                    tags: adTags,
                    contractAddress: inventoryWalletAddress
                }
            });
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
                tagUrlMap[adTags[0]] = url;
            }

            res.send(`
                <h2>Inventory ads uploaded successfully!</h2>
                <p>Tags: ${adTags.join(', ')}</p>
                <p>Contract Address: ${inventoryWalletAddress}</p>
                <a href="/uploadInventoryAds">Upload more</a>
            `);
        } catch (error) {
            console.error('Error uploading inventory ads:', error);
            res.status(500).send('Error uploading inventory ads');
        }
    });

    const tagUrlMap: { [key: string]: string } = {
        food: 'https://www.sheknows.com/food-and-recipes/slideshow/9035/los-angeles-food-trends/',
        camera: 'https://www.freepik.es/fotos-premium/ilustracion-camara_62732202.htm',
        women_dress: 'https://www.thedressoutlet.com/products/fitted-off-shoulder-long-slit-prom-dress?variant=39755767087165&pins_campaign_id=626752536343&pp=0&epik=dj0yJnU9ZzFGa0g5Q29hNFlab0lvc2wwNG45S0N1bnhuNVRwc2MmcD0xJm49WEEtUnZybkhfTWY2bDBIc3pwSFdrUSZ0PUFBQUFBR2FaS0Vv'
    };

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
                
                htmlContent += `<tr><td>${tag}</td><td>${displayAddresses.join('<br>')}</td></tr>`;
                addresses.forEach(address => totalUniqueAddresses.add(address));
            }
    
            htmlContent += '</table>';
            htmlContent += `<p>Total unique addresses: ${totalUniqueAddresses.size}</p>`;
            htmlContent += '<a href="/pullAds">Search Again</a>';
    
            res.send(htmlContent);
        } catch (error) {
            console.error('Error fetching budget addresses by tags:', error);
            res.status(500).send('Error fetching budget addresses by tags');
        }
    });

    app.post('/pullAdsByTags', async (req, res) => {
        try {
            const tags = req.body.tags.split(' ').map((tag: string) => tag.trim()).filter((tag: string) => tag !== '');
            const logic = req.body.logic as 'AND' | 'OR';
    
            if (tags.length === 0) {
                return res.status(400).send('Please provide at least one tag.');
            }
    
            const result = await chainAdsContract.getBudgetAddressesByTags(tags, logic);
            
            const tagUrlDictionary = createTagUrlDictionary(result);

            res.status(200).json({
                success: true,
                message: 'success',
                data: {
                    ads: tagUrlDictionary,
                }
            });
        } catch (error) {
            console.error('Error fetching budget addresses by tags:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching budget addresses by tags',
                error: error
            });
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

const tagUrlMapMap = new Map<string, string>([
    ['food', 'https://www.sheknows.com/food-and-recipes/slideshow/9035/los-angeles-food-trends/'],
    ['camera', 'https://www.freepik.es/fotos-premium/ilustracion-camara_62732202.htm'],
    ['women_dress', 'https://www.thedressoutlet.com/products/fitted-off-shoulder-long-slit-prom-dress?variant=39755767087165&pins_campaign_id=626752536343&pp=0&epik=dj0yJnU9ZzFGa0g5Q29hNFlab0lvc2wwNG45S0N1bnhuNVRwc2MmcD0xJm49WEEtUnZybkhfTWY2bDBIc3pwSFdrUSZ0PUFBQUFBR2FaS0Vv']
]);

function getUrlByTag(tag: string): string | undefined {
    return tagUrlMapMap.get(tag);
}

function createTagUrlDictionary(result: { [tag: string]: string[] }): { [key: string]: string } {
    const tagUrlDictionary: { [key: string]: string } = {};

    for (const [tag, addresses] of Object.entries(result)) {
        const url = tagUrlMapMap.get(tag);
        if (url) {
            tagUrlDictionary[tag] = url;
        }
    }

    return tagUrlDictionary;
}