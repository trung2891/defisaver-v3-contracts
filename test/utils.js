/* eslint-disable import/no-unresolved */
/* eslint-disable no-await-in-loop */
const { default: curve } = require('@curvefi/api');
const hre = require('hardhat');
const fs = require('fs');
const { getAssetInfo, getAssetInfoByAddress } = require('@defisaver/tokens');
const { expect } = require('chai');
const storageSlots = require('./storageSlots.json');

const { deployAsOwner, deployContract } = require('../scripts/utils/deployer');

const strategyStorageBytecode = require('../artifacts/contracts/core/strategy/StrategyStorage.sol/StrategyStorage.json').deployedBytecode;
const subStorageBytecode = require('../artifacts/contracts/core/strategy/SubStorage.sol/SubStorage.json').deployedBytecode;
const subStorageBytecodeL2 = require('../artifacts/contracts/core/l2/SubStorageL2.sol/SubStorageL2.json').deployedBytecode;
const bundleStorageBytecode = require('../artifacts/contracts/core/strategy/BundleStorage.sol/BundleStorage.json').deployedBytecode;
const recipeExecutorBytecode = require('../artifacts/contracts/core/RecipeExecutor.sol/RecipeExecutor.json').deployedBytecode;
const proxyAuthBytecode = require('../artifacts/contracts/core/strategy/ProxyAuth.sol/ProxyAuth.json').deployedBytecode;
const mockChainlinkFeedRegistryBytecode = require('../artifacts/contracts/mocks/MockChainlinkFeedRegistry.sol/MockChainlinkFeedRegistry.json').deployedBytecode;

const addrs = {
    mainnet: {
        PROXY_REGISTRY: '0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4',
        REGISTRY_ADDR: '0x287778F121F134C66212FB16c9b53eC991D32f5b',
        PROXY_AUTH_ADDR: '0x149667b6FAe2c63D1B4317C716b0D0e4d3E2bD70',
        OWNER_ACC: '0xBc841B0dE0b93205e912CFBBd1D0c160A1ec6F00',
        WETH_ADDRESS: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        DAI_ADDRESS: '0x6b175474e89094c44da98b954eedeac495271d0f',
        ETH_ADDR: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        TOKEN_GROUP_REGISTRY: '0xcA49e64FE1FE8be40ED30F682edA1b27a6c8611c',
        FEE_RECEIVER: '0x6467e807dB1E71B9Ef04E0E3aFb962E4B0900B2B',
        USDC_ADDR: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        EXCHANGE_OWNER_ADDR: '0xBc841B0dE0b93205e912CFBBd1D0c160A1ec6F00',
        SAVER_EXCHANGE_ADDR: '0x25dd3F51e0C3c3Ff164DDC02A8E4D65Bb9cBB12D',
        StrategyProxy: '0x0822902D30CC9c77404e6eB140dC1E98aF5b559A',
        SubProxy: '0xd18d4756bbf848674cc35f1a0B86afEF20787382',
        UNISWAP_WRAPPER: '0x6cb48F0525997c2C1594c89e0Ca74716C99E3d54',
        UNISWAP_V3_WRAPPER: '0xA250D449e8246B0be1ecF66E21bB98678448DEF5',
        UNIV3_WRAPPER: '0xA250D449e8246B0be1ecF66E21bB98678448DEF5',
        FEED_REGISTRY: '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf',
        COMET_USDC_ADDR: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
        COMET_USDC_REWARDS_ADDR: '0x1B0e765F6224C21223AeA2af16c1C46E38885a40',
        COMP_ADDR: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
        CHICKEN_BONDS_VIEW: '0x809a93fd4a0d7d7906Ef6176f0b5518b418Da08f',
        AAVE_MARKET: '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e',
        AAVE_V3_VIEW: '0xf4B715BB788cC4071061bd67dC8B56681460A2fF',
        ZRX_ALLOWLIST_ADDR: '0x4BA1f38427b33B8ab7Bb0490200dAE1F1C36823F',
        ZRX_ALLOWLIST_OWNER: '0xBc841B0dE0b93205e912CFBBd1D0c160A1ec6F00',
        AAVE_SUB_PROXY: '0xb9F73625AA64D46A9b2f0331712e9bEE19e4C3f7',
        ADMIN_VAULT: '0xCCf3d848e08b94478Ed8f46fFead3008faF581fD',
        ADMIN_ACC: '0x25eFA336886C74eA8E282ac466BdCd0199f85BB9',
        DFS_REG_CONTROLLER: '0x6F6DaE1bCB60F67B2Cb939dBE565e8fD03F6F002',
        AVG_GAS_PRICE: 100,
    },
    optimism: {
        PROXY_REGISTRY: '0x283Cc5C26e53D66ed2Ea252D986F094B37E6e895',
        REGISTRY_ADDR: '0xAf707Ee480204Ed6e2640B53cE86F680D28Afcbd',
        OWNER_ACC: '0xC9a956923bfb5F141F1cd4467126b3ae91E5CC33',
        WETH_ADDRESS: '0x4200000000000000000000000000000000000006',
        DAI_ADDRESS: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        USDC_ADDR: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
        EXCHANGE_OWNER_ADDR: '0xc9a956923bfb5f141f1cd4467126b3ae91e5cc33',
        SAVER_EXCHANGE_ADDR: '0xFfE2F824f0a1Ca917885CB4f848f3aEf4a32AaB9',
        PROXY_AUTH_ADDR: '0xD6ae16A1aF3002D75Cc848f68060dE74Eccc6043',
        AAVE_MARKET: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb',
        StrategyProxy: '0xEe0C404FD30E289c305E760b3AE1d1Ae6503350f',
        SubProxy: '0x163c08d3F6d916AD6Af55b37728D547e968103F8',
        UNISWAP_V3_WRAPPER: '0xc6F57b45c20aE92174b8B7F86Bb51A1c8e4AD357',
        AAVE_V3_VIEW: '0xC20fA40Dd4f0D3f7431Eb4B6bc0614F36932F6Dc',
        AAVE_SUB_PROXY: '0x9E8aE909Af8A391b58f45819f0d36e4256991D19',
        AVG_GAS_PRICE: 0.001,
        TOKEN_GROUP_REGISTRY: '0x566b2a957D8FCE39D2744059d558F27aF52a70c0',
        ETH_ADDR: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        ZRX_ALLOWLIST_ADDR: '0x52F6ae5aE5a8a6316c970d3a02C50b74c1a50bB8',
        ZRX_ALLOWLIST_OWNER: '0xc9a956923bfb5f141f1cd4467126b3ae91e5cc33',
        ADMIN_VAULT: '0x136b1bEAfff362530F98f10E3D8C38f3a3F3d38C',
        ADMIN_ACC: '0x98118fD1Da4b3369AEe87778168e97044980632F',
        DFS_REG_CONTROLLER: '0x493C0dE902E6916128A223F66F37d3b6ee8fA408',
    },
    arbitrum: {
        PROXY_REGISTRY: '0x283Cc5C26e53D66ed2Ea252D986F094B37E6e895',
        REGISTRY_ADDR: '0xBF1CaC12DB60819Bfa71A328282ecbc1D40443aA',
        OWNER_ACC: '0x926516E60521556F4ab5e7BF16A4d41a8539c7d1',
        WETH_ADDRESS: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        DAI_ADDRESS: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        USDC_ADDR: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        EXCHANGE_OWNER_ADDR: '0x926516e60521556f4ab5e7bf16a4d41a8539c7d1',
        SAVER_EXCHANGE_ADDR: '0xaB1E4b72BC2f3890F052df111EE626c1c7229F26',
        FEE_RECEIVER: '0xe000e3c9428D539566259cCd89ed5fb85e655A01',
        TOKEN_GROUP_REGISTRY: '0xb03fe103f54841821C080C124312059c9A3a7B5c',
        PROXY_AUTH_ADDR: '0xF3A8479538319756e100C386b3E60BF783680d8f',
        AAVE_MARKET: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb',
        SubProxy: '0x275A8f98dBA07Ad6380D3ea3F36B665DD6E02F25',
        StrategyProxy: '0x8F62B8Cd1189dB92ba4CBd4dBE64D03C54fD079B',
        AAVE_V3_VIEW: '0xA74a85407D5A940542915458616aC3cf3f404E3b',
        UNISWAP_V3_WRAPPER: '0x48ef488054b5c570cf3a2ac0a0697b0b0d34c431',
        ETH_ADDR: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        AAVE_SUB_PROXY: '0x29a172f04CF9C6a79EdF4dD2744F2d260b8b8FE4',
        UNISWAP_WRAPPER: '0x48ef488054b5c570cf3a2ac0a0697b0b0d34c431',
        ZRX_ALLOWLIST_ADDR: '0x5eD8e74b1caE57B0c68B3278B88589991FBa0750',
        ZRX_ALLOWLIST_OWNER: '0x926516e60521556f4ab5e7bf16a4d41a8539c7d1',
        ADMIN_VAULT: '0xd47D8D97cAd12A866900eEc6Cde1962529F25351',
        ADMIN_ACC: '0x6AFEA85cFAB61e3a55Ad2e4537252Ec05796BEfa',
        DFS_REG_CONTROLLER: '0x7702fa16b0cED7e44fF7Baeed04bF165f58eE51D',
        AVG_GAS_PRICE: 0.5,
    },
    kovan: {
        PROXY_REGISTRY: '0xF9722E05B68E5ad5D6E1674C4d6BfE11791a1E33',
    },
    kovanOptimism: {
        PROXY_REGISTRY: '0x1fA11C699629E43005fd64f4DA36d9Eb30333ef9',
    },
};

const REGISTRY_ADDR = '0x287778F121F134C66212FB16c9b53eC991D32f5b';
require('dotenv-safe').config();

const config = require('../hardhat.config');

const nullAddress = '0x0000000000000000000000000000000000000000';
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const KYBER_WRAPPER = '0x71C8dc1d6315a48850E88530d18d3a97505d2065';
const UNISWAP_WRAPPER = '0x6cb48F0525997c2C1594c89e0Ca74716C99E3d54';
const OASIS_WRAPPER = '0x2aD7D86C56b7a09742213e1e649C727cB4991A54';
const ETH_ADDR = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const BTC_ADDR = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB';
const DAI_ADDR = '0x6b175474e89094c44da98b954eedeac495271d0f';
const USDC_ADDR = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const RAI_ADDR = '0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919';
const BAL_ADDR = '0xba100000625a3754423978a60c9317c58a424e3D';
const LOGGER_ADDR = '0xcE7a977Cac4a481bc84AC06b2Da0df614e621cf3';
const UNIV3ROUTER_ADDR = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
const UNIV3POSITIONMANAGER_ADDR = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
const AAVE_MARKET = '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5';
const YEARN_REGISTRY_ADDRESS = '0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804';
const STETH_ADDRESS = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84';
const WSTETH_ADDRESS = '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0';
const UNIV2_ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const FEED_REGISTRY_ADDRESS = '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf';
const USD_DENOMINATION = '0x0000000000000000000000000000000000000348';
const BLUSD_ADDR = '0xB9D7DdDca9a4AC480991865EfEf82E01273F79C3';
const BOND_NFT_ADDR = '0xa8384862219188a8f03c144953Cf21fc124029Ee';

// optimism aave V3
const AAVE_MARKET_OPTIMISM = '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb';

// Dfs sdk won't accept 0x0 and we need some rand addr for testing
const placeHolderAddr = '0x0000000000000000000000000000000000000001';
const AUNI_ADDR = '0xb9d7cb55f463405cdfbe4e90a6d2df01c2b92bf1';
const AWETH_ADDR = '0x030ba81f1c18d280636f32af80b9aad02cf0854e';
const AWBTC_ADDR = '0x9ff58f4ffb29fa2266ab25e75e2a8b3503311656';
const ALINK_ADDR = '0xa06bc25b5805d5f8d82847d191cb4af5a3e873e0';
const ADAI_ADDR = '0x028171bca77440897b824ca71d1c56cac55b68a3';
const UNI_ADDR = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';
const LINK_ADDR = '0x514910771af9ca656af840dff83e8264ecf986ca';
const WBTC_ADDR = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
const LUSD_ADDR = '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0';

const USDT_ADDR = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const BUSD_ADDR = '0x4fabb145d64652a948d72533023f6e7a623c7c53';

const OWNER_ACC = '0xBc841B0dE0b93205e912CFBBd1D0c160A1ec6F00';
const ADMIN_ACC = '0x25eFA336886C74eA8E282ac466BdCd0199f85BB9';

const rariDaiFundManager = '0xB465BAF04C087Ce3ed1C266F96CA43f4847D9635';
const rdptAddress = '0x0833cfcb11A5ba89FbAF73a407831c98aD2D7648';

const rariUsdcFundManager = '0xC6BF8C8A55f77686720E0a88e2Fd1fEEF58ddf4a';
const rsptAddress = '0x016bf078ABcaCB987f0589a6d3BEAdD4316922B0';

const MAX_UINT = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
const MAX_UINT128 = '340282366920938463463374607431768211455';

const DFS_REG_CONTROLLER = '0xF8f8B3C98Cf2E63Df3041b73f80F362a4cf3A576';

const dydxTokens = ['WETH', 'USDC', 'DAI'];

let network = hre.network.config.name;

const chainIds = {
    mainnet: 1,
    optimism: 10,
    arbitrum: 42161,
};

const AAVE_FL_FEE = 0.09; // TODO: can we fetch this dynamically
const AAVE_V3_FL_FEE = 0.05;
const MIN_VAULT_DAI_AMOUNT = '45010'; // TODO: can we fetch this dynamically
const MIN_VAULT_RAI_AMOUNT = '3000'; // TODO: can we fetch this dynamically

const AVG_GAS_PRICE = 100; // gwei

const standardAmounts = {
    ETH: '4',
    WETH: '4',
    AAVE: '15',
    BAT: '8000',
    USDC: '8000',
    UNI: '100',
    SUSD: '8000',
    BUSD: '8000',
    SNX: '200',
    REP: '150',
    REN: '2000',
    MKR: '3',
    ENJ: '2000',
    DAI: '8000',
    WBTC: '0.15',
    RENBTC: '0.08',
    ZRX: '4000',
    KNC: '2000',
    MANA: '4000',
    PAXUSD: '8000',
    COMP: '10',
    LRC: '6000',
    LINK: '140',
    USDT: '4000',
    TUSD: '4000',
    BAL: '100',
    GUSD: '4000',
    YFI: '0.1',
};

const coinGeckoHelper = {
    STETH: 'staked-ether',
    CRV: 'curve-dao-token',
    ETH: 'ethereum',
    WETH: 'weth',
    AAVE: 'aave',
    BAT: 'basic-attention-token',
    USDC: 'usd-coin',
    UNI: 'uniswap',
    SUSD: 'nusd',
    BUSD: 'binance-usd',
    SNX: 'havven',
    REP: 'augur',
    REN: 'republic-protocol',
    MKR: 'maker',
    ENJ: 'enjincoin',
    DAI: 'dai',
    WBTC: 'wrapped-bitcoin',
    RENBTC: 'renbtc',
    ZRX: '0x',
    KNCL: 'kyber-network',
    MANA: 'decentraland',
    PAXUSD: 'paxos-standard',
    USDP: 'paxos-standard',
    COMP: 'compound-governance-token',
    LRC: 'loopring',
    LINK: 'chainlink',
    USDT: 'tether',
    TUSD: 'true-usd',
    BAL: 'balancer',
    GUSD: 'gemini-dollar',
    YFI: 'yearn-finance',
    LUSD: 'liquity-usd',
    LQTY: 'liquity',
    TORN: 'tornado-cash',
    mUSD: 'musd',
    imUSD: 'imusd',
    RAI: 'rai',
    MATIC: 'matic-network',
    SUSHI: 'sushi',
    bLUSD: 'boosted-lusd',
    wstETH: 'wrapped-steth',
};

const BN2Float = hre.ethers.utils.formatUnits;

const Float2BN = hre.ethers.utils.parseUnits;

const setNetwork = (networkName) => {
    network = networkName;
};

const getNetwork = () => network;

const getOwnerAddr = () => addrs[network].OWNER_ACC;

async function findBalancesSlot(tokenAddress) {
    const slotObj = storageSlots[tokenAddress];
    if (slotObj) {
        return { isVyper: slotObj.isVyper, num: slotObj.num };
    }

    const encode = (types, values) => hre.ethers.utils.defaultAbiCoder.encode(types, values);
    const account = hre.ethers.constants.AddressZero;
    const probeA = encode(['uint'], [1]);
    const probeB = encode(['uint'], [2]);
    const token = await hre.ethers.getContractAt(
        'IERC20',
        tokenAddress,
    );
    for (let i = 0; i < 100; i++) {
        {
            let probedSlot = hre.ethers.utils.keccak256(
                encode(['address', 'uint'], [account, i]),
            );
            // remove padding for JSON RPC
            while (probedSlot.startsWith('0x0')) { probedSlot = `0x${probedSlot.slice(3)}`; }
            const prev = await hre.ethers.provider.send(
                'eth_getStorageAt',
                [tokenAddress, probedSlot, 'latest'],
            );
            // make sure the probe will change the slot value
            const probe = prev === probeA ? probeB : probeA;

            await hre.ethers.provider.send('hardhat_setStorageAt', [
                tokenAddress,
                probedSlot,
                probe,
            ]);

            const balance = await token.balanceOf(account);
            // reset to previous value
            await hre.ethers.provider.send('hardhat_setStorageAt', [
                tokenAddress,
                probedSlot,
                prev,
            ]);
            if (balance.eq(hre.ethers.BigNumber.from(probe))) {
                const result = { isVyper: false, num: i };
                storageSlots[tokenAddress] = result;
                // file path needs to be from top level folder
                fs.writeFileSync('test/storageSlots.json', JSON.stringify(storageSlots));
                return result;
            }
        }
        {
            let probedSlot = hre.ethers.utils.keccak256(
                encode(['uint', 'address'], [i, account]),
            );
            // remove padding for JSON RPC
            while (probedSlot.startsWith('0x0')) { probedSlot = `0x${probedSlot.slice(3)}`; }
            const prev = await hre.ethers.provider.send(
                'eth_getStorageAt',
                [tokenAddress, probedSlot, 'latest'],
            );
            // make sure the probe will change the slot value
            const probe = prev === probeA ? probeB : probeA;

            await hre.ethers.provider.send('hardhat_setStorageAt', [
                tokenAddress,
                probedSlot,
                probe,
            ]);

            const balance = await token.balanceOf(account);
            // reset to previous value
            await hre.ethers.provider.send('hardhat_setStorageAt', [
                tokenAddress,
                probedSlot,
                prev,
            ]);
            if (balance.eq(hre.ethers.BigNumber.from(probe))) {
                const result = { isVyper: true, num: i };
                storageSlots[tokenAddress] = result;
                // file path needs to be from top level folder
                fs.writeFileSync('test/storageSlots.json', JSON.stringify(storageSlots));
                return result;
            }
        }
    }
    console.log('Balance slot not found');
    return 0;
}

const toBytes32 = (bn) => hre.ethers.utils.hexlify(hre.ethers.utils.zeroPad(bn.toHexString(), 32));

const mineBlock = async () => {
    await hre.ethers.provider.send('evm_mine', []); // Just mines to the next block
};

const timeTravel = async (timeIncrease) => {
    await hre.network.provider.request({
        method: 'evm_increaseTime',
        params: [timeIncrease],
        id: (await hre.ethers.provider.getBlock('latest')).timestamp,
    });

    await mineBlock();
};

const setStorageAt = async (address, index, value) => {
    let prefix = 'hardhat';

    if (hre.network.config.type === 'tenderly') {
        prefix = 'tenderly';
    }

    await hre.ethers.provider.send(`${prefix}_setStorageAt`, [address, index, value]);
    await hre.ethers.provider.send('evm_mine', []); // Just mines to the next block
};

const setBalance = async (tokenAddr, userAddr, value) => {
    try {
        let tokenContract = await hre.ethers.getContractAt('IProxyERC20', tokenAddr);
        const newTokenAddr = await tokenContract.callStatic.target();

        tokenContract = await hre.ethers.getContractAt('IProxyERC20', newTokenAddr);
        const tokenState = await tokenContract.callStatic.tokenState();
        // eslint-disable-next-line no-param-reassign
        tokenAddr = tokenState;
    // eslint-disable-next-line no-empty
    } catch (error) {
    }
    const slotInfo = await findBalancesSlot(tokenAddr);
    let index;
    if (slotInfo.isVyper) {
        index = hre.ethers.utils.solidityKeccak256(
            ['uint256', 'uint256'],
            [slotInfo.num, userAddr], // key, slot
        );
    } else {
        index = hre.ethers.utils.solidityKeccak256(
            ['uint256', 'uint256'],
            [userAddr, slotInfo.num], // key, slot
        );
    }
    while (index.startsWith('0x0')) { index = `0x${index.slice(3)}`; }

    await setStorageAt(
        tokenAddr,
        index.toString(),
        toBytes32(value).toString(),
    );
};

let cachedTokenPrices = {};
const getLocalTokenPrice = (tokenSymbol) => {
    const cachedPrice = cachedTokenPrices[tokenSymbol];
    if (cachedPrice) return cachedPrice;

    const data = JSON.parse(fs.readFileSync('test/prices.json', 'utf8'));
    const tokenNames = Object.keys(data);
    for (let i = 0; i < tokenNames.length; i++) {
        if (tokenNames[i] === coinGeckoHelper[tokenSymbol]) {
            const tokenPrice = data[tokenNames[i]].usd;
            return tokenPrice;
        }
    }
    return 0;
};

const fetchAmountinUSDPrice = (tokenSymbol, amountUSD) => {
    const { decimals } = getAssetInfo(tokenSymbol);
    const tokenPrice = getLocalTokenPrice(tokenSymbol);
    return (amountUSD / tokenPrice).toFixed(decimals);
};

const fetchStandardAmounts = async () => standardAmounts;

const impersonateAccount = async (account) => {
    await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [account],
    });
};

const stopImpersonatingAccount = async (account) => {
    await hre.network.provider.request({
        method: 'hardhat_stopImpersonatingAccount',
        params: [account],
    });
};

const getNameId = (name) => {
    const hash = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(name));

    return hash.substr(0, 10);
};

const getAddrFromRegistry = async (name, regAddr = addrs[network].REGISTRY_ADDR) => {
    const registryInstance = await hre.ethers.getContractFactory('DFSRegistry');
    const registry = registryInstance.attach(regAddr);

    // TODO: Write in registry later
    // if (name === 'StrategyProxy') {
    //     return addrs[network].StrategyProxy;
    // } if (name === 'SubProxy') {
    //     return addrs[network].SubProxy;
    // }
    const addr = await registry.getAddr(
        getNameId(name),
    );
    return addr;
};

const getProxyWithSigner = async (signer, addr) => {
    const proxyRegistry = await
    hre.ethers.getContractAt('IProxyRegistry', addrs[network].PROXY_REGISTRY);

    let proxyAddr = await proxyRegistry.proxies(addr);

    if (proxyAddr === nullAddress) {
        await proxyRegistry.build(addr);
        proxyAddr = await proxyRegistry.proxies(addr);
    }

    const dsProxy = await hre.ethers.getContractAt('IDSProxy', proxyAddr, signer);

    return dsProxy;
};

const getProxy = async (acc) => {
    const proxyRegistry = await
    hre.ethers.getContractAt('IProxyRegistry', addrs[network].PROXY_REGISTRY);
    let proxyAddr = await proxyRegistry.proxies(acc);

    if (proxyAddr === nullAddress) {
        await proxyRegistry.build(acc);
        proxyAddr = await proxyRegistry.proxies(acc);
    }

    const dsProxy = await hre.ethers.getContractAt('IDSProxy', proxyAddr);

    return dsProxy;
};

const sendEther = async (signer, toAddress, amount) => {
    const valueAmount = hre.ethers.utils.parseUnits(amount, 18);
    await signer.sendTransaction({
        to: toAddress,
        value: valueAmount,
    });
};

// eslint-disable-next-line max-len
const redeploy = async (name, regAddr = addrs[getNetwork()].REGISTRY_ADDR, saveOnTenderly = config.saveOnTenderly, isFork = false, ...args) => {
    if (!isFork) {
        await hre.network.provider.send('hardhat_setBalance', [
            getOwnerAddr(),
            '0xC9F2C9CD04674EDEA40000000',
        ]);
        await hre.network.provider.send('hardhat_setNextBlockBaseFeePerGas', [
            '0x1', // 1 wei
        ]);
        if (regAddr === addrs[getNetwork()].REGISTRY_ADDR) {
            await impersonateAccount(getOwnerAddr());
        }

        const ethSender = (await hre.ethers.getSigners())[0];
        await sendEther(ethSender, getOwnerAddr(), '100');
    }

    const signer = await hre.ethers.provider.getSigner(getOwnerAddr());
    const registryInstance = await hre.ethers.getContractFactory('contracts/core/DFSRegistry.sol:DFSRegistry', signer);
    let registry = await registryInstance.attach(regAddr);

    registry = registry.connect(signer);

    const c = await deployAsOwner(name, undefined, ...args);

    if (name === 'StrategyExecutor' || name === 'StrategyExecutorL2') {
        // eslint-disable-next-line no-param-reassign
        name = 'StrategyExecutorID';
    }

    // if (name === 'FLAaveV3') {
    //     // eslint-disable-next-line no-param-reassign
    //     name = 'FLActionL2';
    // }

    const id = getNameId(name);

    console.log(name, id);

    if (!(await registry.isRegistered(id))) {
        await registry.addNewContract(id, c.address, 0, { gasLimit: 2000000 });
    } else {
        await registry.startContractChange(id, c.address, { gasLimit: 2000000 });

        const entryData = await registry.entries(id);

        if (parseInt(entryData.waitPeriod, 10) > 0) {
            await timeTravel(parseInt(entryData.waitPeriod, 10) + 10);
        }

        await registry.approveContractChange(id, { gasLimit: 2000000 });
    }

    // for strategy deployment set open to public for easier testing
    if (name === 'StrategyStorage' || name === 'BundleStorage') {
        const storageContract = c.connect(signer);
        await storageContract.changeEditPermission(true);
    }

    if (hre.network.config.type !== 'tenderly') {
        if (regAddr === addrs[network].REGISTRY_ADDR) {
            await stopImpersonatingAccount(getOwnerAddr());
        }
    }

    if (saveOnTenderly) {
        await hre.tenderly.persistArtifacts({
            name,
            address: c.address,
        });
    }

    return c;
};

const getContractFromRegistry = async (
    name,
    regAddr = addrs[getNetwork()].REGISTRY_ADDR,
    saveOnTenderly = undefined,
    isFork = undefined,
    ...args
) => {
    const contractAddr = await getAddrFromRegistry(name, regAddr);
    if (contractAddr !== nullAddress) return hre.ethers.getContractAt(name, contractAddr);
    return redeploy(name, regAddr, saveOnTenderly, isFork, ...args);
};

const setCode = async (addr, code) => {
    await hre.network.provider.send('hardhat_setCode', [addr, code]);
};

const setContractAt = async ({ name, address, args = [] }) => {
    const contract = await deployContract(name, ...args);

    const deployedBytecode = await hre.network.provider.request({
        method: 'eth_getCode',
        params: [contract.address],
    });

    await setCode(address, deployedBytecode);

    return hre.ethers.getContractAt(name, address);
};

const redeployCore = async (isL2 = false) => {
    const strategyStorageAddr = await getAddrFromRegistry('StrategyStorage', addrs[network].REGISTRY_ADDR);
    await setCode(strategyStorageAddr, strategyStorageBytecode);

    const subStorageAddr = await getAddrFromRegistry('SubStorage', addrs[network].REGISTRY_ADDR);

    if (isL2) await setCode(subStorageAddr, subStorageBytecodeL2);
    else await setCode(subStorageAddr, subStorageBytecode);

    const bundleStorageAddr = await getAddrFromRegistry('BundleStorage', addrs[network].REGISTRY_ADDR);
    await setCode(bundleStorageAddr, bundleStorageBytecode);

    const recipeExecutorAddr = await getAddrFromRegistry('RecipeExecutor', addrs[network].REGISTRY_ADDR);
    await setCode(recipeExecutorAddr, recipeExecutorBytecode);

    await setCode(addrs[network].PROXY_AUTH_ADDR, proxyAuthBytecode);

    await redeploy('SubProxy', addrs[network].REGISTRY_ADDR);
    await redeploy('StrategyProxy', addrs[network].REGISTRY_ADDR);

    let strategyExecutorName = 'StrategyExecutor';
    if (isL2) strategyExecutorName = 'StrategyExecutorL2';

    const strategyExecutor = await redeploy(strategyExecutorName, addrs[network].REGISTRY_ADDR);

    return strategyExecutor;
};

const send = async (tokenAddr, to, amount) => {
    const tokenContract = await hre.ethers.getContractAt('IERC20', tokenAddr);

    await tokenContract.transfer(to, amount);
};

const approve = async (tokenAddr, to, signer) => {
    const tokenContract = await hre.ethers.getContractAt('IERC20', tokenAddr);

    const from = signer ? signer.address : tokenContract.signer.address;

    const allowance = await tokenContract.allowance(from, to);

    if (allowance.toString() === '0') {
        if (signer) {
            const tokenContractSigner = tokenContract.connect(signer);
            // eslint-disable-next-line max-len
            await tokenContractSigner.approve(to, hre.ethers.constants.MaxUint256, { gasLimit: 1000000 });
        } else {
            await tokenContract.approve(to, hre.ethers.constants.MaxUint256, { gasLimit: 1000000 });
        }
    }
};

const getAllowance = async (tokenAddr, from, to) => {
    const tokenContract = await hre.ethers.getContractAt('IERC20', tokenAddr);

    const allowance = await tokenContract.allowance(from, to);

    return allowance;
};

const balanceOf = async (tokenAddr, addr) => {
    let balance = '';

    if (tokenAddr.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        balance = await hre.ethers.provider.getBalance(addr);
    } else {
        const tokenContract = await hre.ethers.getContractAt('IERC20', tokenAddr);
        balance = await tokenContract.balanceOf(addr);
    }
    return balance;
};

const getNftOwner = async (nftAddr, tokenId) => {
    const tokenContract = await hre.ethers.getContractAt('IERC721', nftAddr);
    const owner = await tokenContract.ownerOf(tokenId);

    return owner;
};

const balanceOfOnTokenInBlock = async (tokenAddr, addr, block) => {
    const tokenContract = await hre.ethers.getContractAt('IERC20', tokenAddr);
    let balance = '';
    balance = await tokenContract.balanceOf(addr, { blockTag: block });
    return balance;
};

/// @notice formats exchange object and sets mock wrapper balance
const formatMockExchangeObj = async (
    srcTokenInfo,
    destTokenInfo,
    srcAmount,
    wrapper = undefined,
) => {
    if (!wrapper) {
        // eslint-disable-next-line no-param-reassign
        wrapper = await getAddrFromRegistry('MockExchangeWrapper');
    }

    const rateDecimals = 18 + destTokenInfo.decimals - srcTokenInfo.decimals;
    const rate = Float2BN(
        (getLocalTokenPrice(srcTokenInfo.symbol)
        / getLocalTokenPrice(destTokenInfo.symbol)).toFixed(rateDecimals),
        rateDecimals,
    );

    const expectedOutput = hre.ethers.constants.MaxInt256;

    await setBalance(
        destTokenInfo.addresses[chainIds[network]],
        wrapper,
        expectedOutput,
    );

    return [
        srcTokenInfo.addresses[chainIds[network]],
        destTokenInfo.addresses[chainIds[network]],
        srcAmount,
        0,
        0,
        0,
        nullAddress,
        wrapper,
        hre.ethers.utils.defaultAbiCoder.encode(['uint256'], [rate]),
        [nullAddress, nullAddress, nullAddress, 0, 0, hre.ethers.utils.toUtf8Bytes('')],
    ];
};

// eslint-disable-next-line max-len
const formatExchangeObj = (srcAddr, destAddr, amount, wrapper, destAmount = 0, uniV3fee, minPrice = 0) => {
    const abiCoder = new hre.ethers.utils.AbiCoder();

    let firstPath = srcAddr;
    let secondPath = destAddr;

    if (srcAddr.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        firstPath = addrs[network].WETH_ADDRESS;
    }

    if (destAddr.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        secondPath = addrs[network].WETH_ADDRESS;
    }

    // quick fix if we use strategy placeholder value
    if (firstPath[0] === '%' || firstPath[0] === '&') {
        firstPath = nullAddress;
        secondPath = nullAddress;
    }

    let path = abiCoder.encode(['address[]'], [[firstPath, secondPath]]);
    if (uniV3fee > 0) {
        if (destAmount > 0) {
            path = hre.ethers.utils.solidityPack(['address', 'uint24', 'address'], [secondPath, uniV3fee, firstPath]);
        } else {
            path = hre.ethers.utils.solidityPack(['address', 'uint24', 'address'], [firstPath, uniV3fee, secondPath]);
        }
    }
    return [
        srcAddr,
        destAddr,
        amount,
        destAmount,
        minPrice,
        0,
        nullAddress,
        wrapper,
        path,
        [nullAddress, nullAddress, nullAddress, 0, 0, hre.ethers.utils.toUtf8Bytes('')],
    ];
};

const formatExchangeObjCurve = async (
    srcAddr,
    destAddr,
    amount,
    wrapper,
) => {
    const { route: sdkRoute } = await curve.getBestRouteAndOutput(
        srcAddr,
        destAddr,
        '1000', // this is fine
    );
    const swapParams = sdkRoute.map((e) => [e.i, e.j, e.swapType]).concat(
        [...Array(4 - sdkRoute.length).keys()].map(
            () => [0, 0, 0],
        ),
    );
    const route = [srcAddr].concat(
        ...sdkRoute.map((e) => [e.poolAddress, e.outputCoinAddress]),
        ...[...Array(8 - (sdkRoute.length) * 2).keys()].map(
            () => [nullAddress],
        ),
    );

    const exchangeData = hre.ethers.utils.defaultAbiCoder.encode(
        ['address[9]', 'uint256[3][4]'],
        [route, swapParams],
    );

    return [
        srcAddr,
        destAddr,
        amount,
        0,
        0,
        0,
        nullAddress,
        wrapper,
        exchangeData,
        [nullAddress, nullAddress, nullAddress, 0, 0, hre.ethers.utils.toUtf8Bytes('')],
    ];
};

const formatExchangeObjSdk = async (srcAddr, destAddr, amount, wrapper) => {
    console.log({ srcAddr, destAddr });
    const { AlphaRouter, SwapType } = await import('@uniswap/smart-order-router');
    const {
        CurrencyAmount,
        Token,
        TradeType,
        Percent,
    } = await import('@uniswap/sdk-core');

    const chainId = chainIds[network];
    const srcTokenInfo = getAssetInfoByAddress(srcAddr, chainId);
    const srcToken = new Token(
        chainId,
        srcAddr,
        srcTokenInfo.decimals,
        srcTokenInfo.symbol,
        srcTokenInfo.name,
    );
    const destTokenInfo = getAssetInfoByAddress(destAddr, chainId);
    const destToken = new Token(
        chainId,
        destAddr,
        destTokenInfo.decimals,
        destTokenInfo.symbol,
        destTokenInfo.name,
    );
    const swapAmount = CurrencyAmount.fromRawAmount(srcToken, amount.toString());

    const router = new AlphaRouter({ chainId, provider: hre.ethers.provider });
    const { path } = await router.route(
        swapAmount, destToken, TradeType.EXACT_INPUT,
        {
            type: SwapType.SWAP_ROUTER_02,
            slippageTolerance: new Percent(5, 100),
        },
        {
            maxSplits: 0,
        },
    ).then(({ methodParameters }) => hre.ethers.utils.defaultAbiCoder.decode(
        ['(bytes path,address,uint256,uint256)'],
        `0x${methodParameters.calldata.slice(10)}`,
    )[0]);

    console.log({ path });

    return [
        srcAddr,
        destAddr,
        amount,
        0,
        0,
        0,
        nullAddress,
        wrapper,
        path,
        [nullAddress, nullAddress, nullAddress, 0, 0, hre.ethers.utils.toUtf8Bytes('')],
    ];
};

const isEth = (tokenAddr) => {
    if (tokenAddr.toLowerCase() === ETH_ADDR.toLowerCase()
    || tokenAddr.toLowerCase() === addrs[network].WETH_ADDRESS.toLowerCase()
    ) {
        return true;
    }

    return false;
};

const convertToWeth = (tokenAddr) => {
    if (isEth(tokenAddr)) {
        return addrs[network].WETH_ADDRESS;
    }

    return tokenAddr;
};

const getProxyAuth = async (proxyAddr, addrWithAuth) => {
    const dsAuth = await hre.ethers.getContractAt('DSAuth', proxyAddr);
    const authorityAddr = await dsAuth.authority();
    const dsGuard = await hre.ethers.getContractAt('DSAuthority', authorityAddr);
    const selector = '0x1cff79cd'; // execute selector

    const hasPermission = await dsGuard.canCall(addrWithAuth, proxyAddr, selector);

    return hasPermission;
};

const setNewExchangeWrapper = async (acc, newAddr) => {
    const exchangeOwnerAddr = addrs[network].EXCHANGE_OWNER_ADDR;
    await sendEther(acc, exchangeOwnerAddr, '1');
    await impersonateAccount(exchangeOwnerAddr);

    const signer = await hre.ethers.provider.getSigner(exchangeOwnerAddr);

    const registryInstance = await hre.ethers.getContractFactory('SaverExchangeRegistry');
    const registry = await registryInstance.attach(addrs[network].SAVER_EXCHANGE_ADDR);
    const registryByOwner = registry.connect(signer);

    await registryByOwner.addWrapper(newAddr, { gasLimit: 300000 });
    await stopImpersonatingAccount(exchangeOwnerAddr);
};

const depositToWeth = async (amount, signer) => {
    const weth = await hre.ethers.getContractAt('IWETH', addrs[network].WETH_ADDRESS);

    if (signer) {
        const wethWithSigner = weth.connect(signer);
        await wethWithSigner.deposit({ value: amount });
    } else {
        await weth.deposit({ value: amount });
    }
};

const expectCloseEq = (expected, actual) => {
    expect(expected).to.be.closeTo(actual, (expected * 1e-6).toFixed(0));
};

const formatExchangeObjForOffchain = (
    srcAddr,
    destAddr,
    amount,
    wrapper,
    exchangeAddr,
    allowanceTarget,
    price,
    protocolFee,
    callData,
) => [
    srcAddr,
    destAddr,
    amount,
    0,
    0,
    0,
    nullAddress,
    wrapper,
    [],
    [wrapper, exchangeAddr, allowanceTarget, price, protocolFee, callData],
];

const addToZRXAllowlist = async (acc, newAddr) => {
    const exchangeOwnerAddr = addrs[network].ZRX_ALLOWLIST_OWNER;
    await sendEther(acc, exchangeOwnerAddr, '1');
    await impersonateAccount(exchangeOwnerAddr);

    const signer = await hre.ethers.provider.getSigner(exchangeOwnerAddr);

    const registryInstance = await hre.ethers.getContractFactory('ZrxAllowlist');
    const zrxAllowlistAddr = addrs[network].ZRX_ALLOWLIST_ADDR;
    const registry = await registryInstance.attach(zrxAllowlistAddr);
    const registryByOwner = await registry.connect(signer);

    await registryByOwner.setAllowlistAddr(newAddr, true);
    await stopImpersonatingAccount(exchangeOwnerAddr);
};

const getGasUsed = async (receipt) => {
    const parsed = await receipt.wait();

    return parsed.gasUsed.toString();
};

const callDataCost = (calldata) => {
    if (calldata.slice(0, 2) === '0x') {
        // eslint-disable-next-line no-param-reassign
        calldata = calldata.slice(2);
    }

    let cost = 0;
    for (let i = 0; i < calldata.length / 2; i++) {
        if (calldata.slice(2 * i, 2 * i + 2) === '00') {
            cost += 4;
        } else {
            cost += 16;
        }
    }

    return cost;
};

const calcGasToUSD = (gasUsed, gasPriceInGwei = 0, callData = 0) => {
    if (gasPriceInGwei === 0) {
        // eslint-disable-next-line no-param-reassign
        gasPriceInGwei = addrs[network].AVG_GAS_PRICE;
    }

    let extraCost = 0;

    if (callData !== 0) {
        const l1GasCost = callDataCost(callData);

        extraCost = ((l1GasCost) * addrs.mainnet.AVG_GAS_PRICE * 1000000000) / 1e18;

        console.log('L1 gas cost:', extraCost);
    }

    let ethSpent = ((gasUsed) * gasPriceInGwei * 1000000000) / 1e18;
    ethSpent += extraCost;

    console.log('Eth gas cost: ', ethSpent);

    return (ethSpent * getLocalTokenPrice('WETH')).toFixed(2);
};

const getChainLinkPrice = async (tokenAddr) => {
    const feedRegistry = await hre.ethers.getContractAt('IFeedRegistry', FEED_REGISTRY_ADDRESS);

    const data = await feedRegistry.latestRoundData(tokenAddr, USD_DENOMINATION);

    // const decimals = await feedRegistry.decimals(tokenAddr, USD_DENOMINATION);

    return data.answer.toString();
};

const cacheChainlinkPrice = async (tokenSymbol, tokenAddr) => {
    try {
        if (cachedTokenPrices[tokenSymbol]) return cachedTokenPrices[tokenSymbol];

        // eslint-disable-next-line no-param-reassign
        if (tokenAddr.toLowerCase() === WBTC_ADDR.toLowerCase()) tokenAddr = BTC_ADDR;

        let wstethMultiplier = '1';
        if (tokenAddr.toLowerCase() === WSTETH_ADDRESS.toLowerCase()) {
            // eslint-disable-next-line no-param-reassign
            tokenAddr = STETH_ADDRESS;
            wstethMultiplier = BN2Float(await hre.ethers.provider.call({
                to: WSTETH_ADDRESS,
                data: hre.ethers.utils.id('stEthPerToken()').slice(0, 10),
            }));
        }

        let tokenPrice = BN2Float(await getChainLinkPrice(tokenAddr), 8);
        tokenPrice = (+wstethMultiplier * +tokenPrice).toFixed(2);
        cachedTokenPrices[tokenSymbol] = tokenPrice;

        return tokenPrice;
    } catch (e) {
        console.log(e);
        console.log(`no chainlink feed found ${tokenSymbol} ${tokenAddr}`);
        return undefined;
    }
};

const takeSnapshot = async () => hre.network.provider.request({
    method: 'evm_snapshot',
});

const revertToSnapshot = async (snapshotId) => hre.network.provider.request({
    method: 'evm_revert',
    params: [snapshotId],
});

const getWeth = () => addrs[network].WETH_ADDRESS;

const openStrategyAndBundleStorage = async (isFork) => {
    const strategySubAddr = await getAddrFromRegistry('StrategyStorage');
    const bundleSubAddr = await getAddrFromRegistry('BundleStorage');

    const currOwnerAddr = getOwnerAddr();

    const ownerSigner = await hre.ethers.provider.getSigner(currOwnerAddr);

    if (!isFork) {
        await impersonateAccount(currOwnerAddr);
    }

    let strategyStorage = await hre.ethers.getContractAt('StrategyStorage', strategySubAddr);
    let bundleStorage = await hre.ethers.getContractAt('BundleStorage', bundleSubAddr);

    strategyStorage = strategyStorage.connect(ownerSigner);
    bundleStorage = bundleStorage.connect(ownerSigner);

    await strategyStorage.changeEditPermission(true);
    await bundleStorage.changeEditPermission(true);

    if (!isFork) {
        await stopImpersonatingAccount(currOwnerAddr);
    }
};

async function setForkForTesting() {
    const senderAcc = (await hre.ethers.getSigners())[0];
    await hre.network.provider.send('hardhat_setBalance', [
        senderAcc.address,
        '0xC9F2C9CD04674EDEA40000000',
    ]);
    await hre.network.provider.send('hardhat_setBalance', [
        OWNER_ACC,
        '0xC9F2C9CD04674EDEA40000000',
    ]);
    await hre.network.provider.send('hardhat_setNextBlockBaseFeePerGas', [
        '0x1', // 1 wei
    ]);
}

const resetForkToBlock = async (block) => {
    cachedTokenPrices = {};
    let rpcUrl = process.env.ETHEREUM_NODE;

    if (network !== 'mainnet') {
        rpcUrl = process.env[`${network.toUpperCase()}_NODE`];
    }

    if (block) {
        await hre.network.provider.request({
            method: 'hardhat_reset',
            params: [
                {
                    forking: {
                        jsonRpcUrl: rpcUrl,
                        blockNumber: block,
                    },
                },
            ],
        });
    } else {
        await hre.network.provider.request({
            method: 'hardhat_reset',
            params: [
                {
                    forking: {
                        jsonRpcUrl: rpcUrl,
                    },
                },
            ],
        });
    }
    await setForkForTesting();
};

const mockChainlinkPriceFeed = async () => {
    await setCode(addrs[network].FEED_REGISTRY, mockChainlinkFeedRegistryBytecode);

    const registryInstance = await hre.ethers.getContractFactory('MockChainlinkFeedRegistry');
    const registry = await registryInstance.attach(addrs[network].FEED_REGISTRY);

    return registry;
};

const setMockPrice = async (mockContract, roundId, token, price) => {
    const USD_QUOTE = '0x0000000000000000000000000000000000000348';
    const formattedPrice = price * 1e8;
    const c = await hre.ethers.getContractAt(
        'MockChainlinkFeedRegistry',
        addrs[network].FEED_REGISTRY,
    );
    await c.setRoundData(token, USD_QUOTE, roundId, formattedPrice);
};

const filterEthersObject = (obj) => {
    if (typeof obj !== 'object') return obj;
    if (obj instanceof hre.ethers.BigNumber) return obj.toString();

    const keys = Object.keys(obj);
    const stringKeys = keys.filter((key, i) => +key !== i);

    if (stringKeys.length !== 0) {
        return stringKeys.reduce(
            (acc, key) => ({ ...acc, [key]: filterEthersObject(obj[key]) }),
            {},
        );
    }
    return keys.map((key) => filterEthersObject(obj[key]));
};

module.exports = {
    addToZRXAllowlist,
    getAddrFromRegistry,
    getProxy,
    getProxyWithSigner,
    redeploy,
    send,
    approve,
    balanceOf,
    formatExchangeObj,
    formatExchangeObjSdk,
    formatExchangeObjForOffchain,
    isEth,
    sendEther,
    impersonateAccount,
    stopImpersonatingAccount,
    convertToWeth,
    depositToWeth,
    timeTravel,
    fetchStandardAmounts,
    setNewExchangeWrapper,
    fetchAmountinUSDPrice,
    getGasUsed,
    getNameId,
    getChainLinkPrice,
    getLocalTokenPrice,
    calcGasToUSD,
    getProxyAuth,
    getAllowance,
    openStrategyAndBundleStorage,
    redeployCore,
    getOwnerAddr,
    getWeth,
    BN2Float,
    Float2BN,
    callDataCost,
    mockChainlinkPriceFeed,
    setMockPrice,
    getNftOwner,
    addrs,
    AVG_GAS_PRICE,
    standardAmounts,
    nullAddress,
    dydxTokens,
    REGISTRY_ADDR,
    AAVE_MARKET,
    DAI_ADDR,
    KYBER_WRAPPER,
    UNISWAP_WRAPPER,
    OASIS_WRAPPER,
    WETH_ADDRESS,
    ETH_ADDR,
    OWNER_ACC,
    ADMIN_ACC,
    USDC_ADDR,
    AAVE_FL_FEE,
    AAVE_V3_FL_FEE,
    MIN_VAULT_DAI_AMOUNT,
    MIN_VAULT_RAI_AMOUNT,
    RAI_ADDR,
    MAX_UINT,
    MAX_UINT128,
    LOGGER_ADDR,
    UNIV3ROUTER_ADDR,
    UNIV3POSITIONMANAGER_ADDR,
    YEARN_REGISTRY_ADDRESS,
    placeHolderAddr,
    STETH_ADDRESS,
    UNIV2_ROUTER_ADDRESS,
    DFS_REG_CONTROLLER,
    BAL_ADDR,
    AUNI_ADDR,
    AWETH_ADDR,
    ADAI_ADDR,
    UNI_ADDR,
    ALINK_ADDR,
    LINK_ADDR,
    USDT_ADDR,
    BUSD_ADDR,
    AWBTC_ADDR,
    WBTC_ADDR,
    WSTETH_ADDRESS,
    LUSD_ADDR,
    rariDaiFundManager,
    rdptAddress,
    rariUsdcFundManager,
    rsptAddress,
    AAVE_MARKET_OPTIMISM,
    network,
    chainIds,
    BLUSD_ADDR,
    BOND_NFT_ADDR,
    setNetwork,
    getNetwork,
    setBalance,
    takeSnapshot,
    revertToSnapshot,
    mineBlock,
    setForkForTesting,
    resetForkToBlock,
    balanceOfOnTokenInBlock,
    formatExchangeObjCurve,
    formatMockExchangeObj,
    cacheChainlinkPrice,
    expectCloseEq,
    setContractAt,
    getContractFromRegistry,
    filterEthersObject,
    curveApiInit: async () => curve.init('Alchemy', {
        url: hre.network.url,
    }),
};
