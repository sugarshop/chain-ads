# chain-ads
# Decentralized Ads Market.

# Prize Award
![We Are The World](https://github.com/sugarshop/chain-ads/blob/readme/WeAreTheWorld.png)

![AI x Web3](https://github.com/sugarshop/chain-ads/blob/readme/CryptoPond.png)

# How to use it.
![Buy ads space](https://github.com/sugarshop/chain-ads/blob/readme/Budget.jpg)

![Place ads URL Link](https://github.com/sugarshop/chain-ads/blob/readme/Inventory.jpg)

## Project structure

-   `contracts` - source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts.
-   `scripts` - scripts used by the project, mainly the deployment scripts.

## How to use

### Build

`npx blueprint build` or `yarn blueprint build`

### Test

`npx blueprint test` or `yarn blueprint test`

### Deploy or run another script

`npx blueprint run` or `yarn blueprint run`

### Add a new contract

`npx blueprint create ContractName` or `yarn blueprint create ContractName`
