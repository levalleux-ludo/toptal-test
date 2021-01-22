// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const hre = require("hardhat");

const tokenName = 'Badium';
const tokenSymbol = 'BAD';
const decimals = 18;
const initialSupply = 10000000;

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile 
    // manually to make sure everything is compiled
    // await hre.run('compile');

    // We get the contract to deploy
    const BadiumFactory = await hre.ethers.getContractFactory("Badium");
    const [deployer] = await ethers.getSigners();
    const initialOwner = await deployer.getAddress();
    const badium = await BadiumFactory.deploy(
        tokenName,
        tokenSymbol,
        decimals,
        hre.ethers.BigNumber.from(initialSupply).mul(hre.ethers.BigNumber.from(10).pow(decimals)),
        initialOwner
    );
    await badium.deployed();
    console.log("Badium deployed to:", badium.address);

    const MarketFactory = await ethers.getContractFactory("Market");
    const market = await MarketFactory.deploy();
    await market.deployed();
    console.log("Market deployed to:", market.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });