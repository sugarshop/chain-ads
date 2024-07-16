import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { ChainAds } from '../wrappers/ChainAds';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('ChainAds', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('ChainAds');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let chainAds: SandboxContract<ChainAds>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        chainAds = blockchain.openContract(
            ChainAds.createFromConfig(
                {
                    id: 0,
                    counter: 0,
                },
                code
            )
        );

        deployer = await blockchain.treasury('deployer');

        const deployResult = await chainAds.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: chainAds.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and chainAds are ready to use
    });

    it('should increase counter', async () => {
        const increaseTimes = 3;
        for (let i = 0; i < increaseTimes; i++) {
            console.log(`increase ${i + 1}/${increaseTimes}`);

            const increaser = await blockchain.treasury('increaser' + i);

            const counterBefore = await chainAds.getCounter();

            console.log('counter before increasing', counterBefore);

            const increaseBy = Math.floor(Math.random() * 100);

            console.log('increasing by', increaseBy);

            const increaseResult = await chainAds.sendIncrease(increaser.getSender(), {
                increaseBy,
                value: toNano('0.05'),
            });

            expect(increaseResult.transactions).toHaveTransaction({
                from: increaser.address,
                to: chainAds.address,
                success: true,
            });

            const counterAfter = await chainAds.getCounter();

            console.log('counter after increasing', counterAfter);

            expect(counterAfter).toBe(counterBefore + increaseBy);
        }
    });
});
