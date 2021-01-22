const { expect } = require("chai");
const hre = require("hardhat");
const { revertMessage } = require("./utils");
const ethers = hre.ethers;

let deployer, accoun1, account2;
let deployerAddr, account1Addr, account2Addr;
let MarketFactory;
let market;
async function initTestVariables() {
    [deployer, account1, account2] = await ethers.getSigners();
    deployerAddr = await deployer.getAddress();
    account1Addr = await account1.getAddress();
    account2Addr = await account2.getAddress();
    MarketFactory = await ethers.getContractFactory("Market");
}
async function createContract() {
    market = await MarketFactory.deploy();

    await market.deployed();
}

describe("Market Deployment", async() => {
    before('', async() => {
        await initTestVariables();
    })
    it("Should verify that the Market contract is deployed", async() => {
        await createContract();
        expect(market.address).to.not.equal('0x' + '0'.repeat(32));
    });
});

describe('Market Ownership', async() => {
    before('', async() => {
        await initTestVariables();
        await createContract();
    });
    it('Verify initial owner', async() => {
        expect(await market.owner()).to.equal(deployerAddr);
    });
    it('The owner can transfer the contract ownership to another account', async() => {
        await market.connect(deployer).transferOwnership(account1Addr);
        expect(await market.owner()).to.equal(account1Addr);
    });
    it('Another user cannot transfer the contract ownership to another account', async() => {
        await expect(market.connect(deployer).transferOwnership(account2Addr)).to.be.revertedWith(revertMessage('Ownable: caller is not the owner'));
    });
});