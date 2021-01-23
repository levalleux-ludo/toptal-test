// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { getBalanceAsNumber } = require('../test/utils');
const hre = require("hardhat");

const tokenName = 'Badium';
const tokenSymbol = 'BAD';
const decimals = 18;
const initialSupply = 10000000;
const tokenPrice = ethers.constants.WeiPerEther.div(100); // 0.01 ETH

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile 
    // manually to make sure everything is compiled
    // await hre.run('compile');

    const [deployer] = await ethers.getSigners();
    const balance_before = await deployer.getBalance();
    console.log('Deployer address', await deployer.getAddress(), 'balance', getBalanceAsNumber(balance_before, 18, 4));

    // We get the contract to deploy
    const BadiumFactory = await hre.ethers.getContractFactory("Badium");
    const badium = await BadiumFactory.deploy(
        tokenName,
        tokenSymbol,
        decimals
    );
    await badium.deployed();
    console.log("Badium deployed to:", badium.address);

    const MarketFactory = await ethers.getContractFactory("Market");
    const market = await MarketFactory.deploy(tokenPrice, badium.address);
    await market.deployed();
    console.log("Market deployed to:", market.address);

    await badium.mint(
        market.address,
        hre.ethers.BigNumber.from(initialSupply).mul(hre.ethers.BigNumber.from(10).pow(decimals))
    );
    console.log("Initial Supply minted to:", market.address);

    await badium.setBuyerContract(market.address);
    console.log("Badium:setBuyerContract ->", market.address);

    const balance_after = await deployer.getBalance();
    console.log('Paid fees', getBalanceAsNumber(balance_before.sub(balance_after), 18, 4), 'new balance', getBalanceAsNumber(balance_after, 18, 4));

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });