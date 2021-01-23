const { ethers } = require("hardhat");

function revertMessage(error) {
    return 'VM Exception while processing transaction: revert ' + error;
}

function getBalanceAsNumber(bn, decimals, accuracy) {
    const r1 = ethers.BigNumber.from(10).pow(decimals - accuracy);
    const r2 = bn.div(r1);
    const r3 = r2.toNumber();
    const r4 = r3 / (10 ** accuracy);
    return r4;
}


module.exports = {
    revertMessage,
    getBalanceAsNumber
}