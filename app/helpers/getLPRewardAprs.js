const Web3 = require("web3");
const addresses = require("../constants/addresses");
const uri = require("../constants/uri");
const tokenPrices = require("./getTokenPrices");
const fetchLP24Volume = require("./getLP24Volumes");
const DEFAULT_CHAINID = require("../constants/chainId");
const PairABI = require("../abis/contracts/pair.json").abi;


if (typeof web3 !== 'undefined') {
    var web3 = new Web3(web3.currentProvider)
} else {
    var web3 = new Web3(new Web3.providers.HttpProvider(uri[DEFAULT_CHAINID]));
}

let lpRewardAprs = {};

const getLpRewardAPR = async (lpName) => {
    try {
        const str = lpName.split("_");
        const tokenName0 = str[0];
        const tokenName1 = str[1];

        const pairAddress = addresses[lpName][DEFAULT_CHAINID];
        const pair = new web3.eth.Contract( PairABI, pairAddress);

        const token0Price = tokenPrices.getPrices(tokenName0);
        const token1Price = tokenPrices.getPrices(tokenName1);
        const lp_24h_volume = await fetchLP24Volume(lpName);
        const reserves = await pair.methods.getReserves().call();

        if(reserves[0] == 0 || reserves[1] == 0) return 0;

        var token0Reserve = reserves[0] / Math.pow(10, 18);
        var token1Reserve = reserves[1] / Math.pow(10, 18);

        const token0 = await pair.methods.token0().call();
        if(token0 == addresses[tokenName1][DEFAULT_CHAINID]){
            token1Reserve = reserves[0] / Math.pow(10, 18);
            token0Reserve = reserves[1] / Math.pow(10, 18);
        }

        const lp_liquidity = token0Reserve * token0Price + token1Reserve * token1Price;

        lpRewardAprs[lpName] = (lp_24h_volume * (0.17 / 100) * 365) / lp_liquidity;
        return lpRewardAprs[lpName];

    } catch (err) {
        // console.log(err);
        return lpRewardAprs[lpName];
    }
};
module.exports = getLpRewardAPR;