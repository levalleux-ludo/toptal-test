const { expect } = require("chai");
const hre = require("hardhat");
const { revertMessage } = require("./utils");
const ethers = hre.ethers;

let deployer, account1, account2;
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
    const tokenPrice = ethers.constants.WeiPerEther.div(100); // 0.01 ETH
    const tokenContract = '0x' + '0'.repeat(40);
    market = await MarketFactory.deploy(tokenPrice, tokenContract);
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
    it('Verify token price', async() => {
        expect((await market.tokenPrice()).toString()).to.equal('1' + '0'.repeat(16));
    });
    it('The owner can transfer the contract ownership to another account', async() => {
        await market.connect(deployer).transferOwnership(account1Addr);
        expect(await market.owner()).to.equal(account1Addr);
    });
    it('Another user cannot transfer the contract ownership to another account', async() => {
        await expect(market.connect(deployer).transferOwnership(account2Addr)).to.be.revertedWith(revertMessage('Ownable: caller is not the owner'));
    });
});

describe('Market change tokenPrice', async() => {
    before('', async() => {
        await initTestVariables();
        await createContract();
    });
    it('The owner can change the token price (in wei)', async() => {
        expect((await market.tokenPrice()).toString()).to.equal('1' + '0'.repeat(16));
        const newPrice = ethers.constants.WeiPerEther.div(50); // 0.02 ETH
        await market.connect(deployer).setTokenPrice(newPrice);
        expect((await market.tokenPrice()).toString()).to.equal('2' + '0'.repeat(16));
    });
    it('Another user can not change the token price', async() => {
        expect((await market.tokenPrice()).toString()).to.equal('2' + '0'.repeat(16));
        const newPrice = ethers.constants.WeiPerEther.div(25); // 0.04 ETH
        await expect(market.connect(account2).setTokenPrice(newPrice)).to.be.revertedWith(revertMessage('Ownable: caller is not the owner'));
        expect((await market.tokenPrice()).toString()).to.equal('2' + '0'.repeat(16));
    });
})