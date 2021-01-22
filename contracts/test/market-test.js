const { expect } = require("chai");
const hre = require("hardhat");
const { revertMessage } = require("./utils");
const ethers = hre.ethers;

let deployer, accoun1, account2;
let deployerAddr, account1Addr, account2Addr;
let MarketFactory;
let market;

describe("Market Deployment", async() => {
    before('', async() => {
        [deployer, account1, account2] = await ethers.getSigners();
        deployerAddr = await deployer.getAddress();
        account1Addr = await account1.getAddress();
        account2Addr = await account2.getAddress();
        MarketFactory = await ethers.getContractFactory("Market");
    })
    it("Should verify that the Market contract is deployed", async() => {
        market = await MarketFactory.deploy();

        await market.deployed();
        expect(market.address).to.not.equal('0x' + '0'.repeat(32));
    });
});

describe('Market Ownership', async() => {
    before('', async() => {
        [deployer, account1, account2] = await ethers.getSigners();
        deployerAddr = await deployer.getAddress();
        account1Addr = await account1.getAddress();
        account2Addr = await account2.getAddress();
        MarketFactory = await ethers.getContractFactory("Market");
        market = await MarketFactory.deploy();
        await market.deployed();
    });
    it('Verify initial owner', async() => {
        expect(await market.owner()).to.equal(deployerAddr);
    });
});