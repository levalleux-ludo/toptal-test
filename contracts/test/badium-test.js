const { expect } = require("chai");
const hre = require("hardhat");
const { revertMessage } = require("./utils");
const ethers = hre.ethers;

let deployer, accoun1, account2;
let deployerAddr, account1Addr, account2Addr;
let initialOwner;
let BadiumFactory;
let badium;
const tokenName = 'Badium';
const tokenSymbol = 'BAD';
const decimals = 18;
const initialSupply = 10000000;

describe("Badium Token Deployment", async() => {
    before('', async() => {
        [deployer, account1, account2] = await ethers.getSigners();
        deployerAddr = await deployer.getAddress();
        account1Addr = await account1.getAddress();
        account2Addr = await account2.getAddress();
        BadiumFactory = await ethers.getContractFactory("Badium");
        initialOwner = account1Addr;
    })
    it("Should verify that the token contract is deployed", async() => {
        badium = await BadiumFactory.deploy(
            tokenName,
            tokenSymbol,
            decimals,
            hre.ethers.BigNumber.from(initialSupply).mul(hre.ethers.BigNumber.from(10).pow(decimals)),
            initialOwner);

        await badium.deployed();
        expect(badium.address).to.not.equal('0x' + '0'.repeat(32));
    });
    it('Verify name', async() => {
        expect(await badium.name()).to.equal(tokenName);
    });
    it('Verify symbol', async() => {
        expect(await badium.symbol()).to.equal(tokenSymbol);
    });
    it('Verify decimals', async() => {
        expect(await badium.decimals()).to.equal(decimals);
    });
    it('Verify totalSupply', async() => {
        expect((await badium.totalSupply()).toString()).to.equal(initialSupply.toString() + '0'.repeat(decimals));
    });
    it('Verify initialOwner balance', async() => {
        expect((await badium.balanceOf(account1Addr)).toString()).to.equal(initialSupply.toString() + '0'.repeat(decimals));
    });
});

describe('Test Badium token standard ERC20 features', async() => {
    let balance1Before, balance2Before, balanceOwnerBefore, totalSupplyBefore;
    before('', async() => {
        [deployer, account1, account2] = await ethers.getSigners();
        deployerAddr = await deployer.getAddress();
        account1Addr = await account1.getAddress();
        account2Addr = await account2.getAddress();
        BadiumFactory = await ethers.getContractFactory("Badium");
        initialOwner = account1Addr;
        badium = await BadiumFactory.deploy(
            tokenName,
            tokenSymbol,
            decimals,
            hre.ethers.BigNumber.from(initialSupply).mul(hre.ethers.BigNumber.from(10).pow(decimals)),
            initialOwner);

        await badium.deployed();
    });
    beforeEach('update balances', async() => {
        balance1Before = await badium.balanceOf(account1Addr);
        balance2Before = await badium.balanceOf(account2Addr);
        balanceOwnerBefore = await badium.balanceOf(deployerAddr);
        totalSupplyBefore = await badium.totalSupply();
    });
    it('Verify initial balances', async() => {
        expect(balanceOwnerBefore.toNumber()).to.equal(0);
        expect(balance1Before.toString()).to.equal(initialSupply.toString() + '0'.repeat(decimals));
        expect(balance2Before.toNumber()).to.equal(0);
    });
    it('Verify transfer 1 -> 2', async() => {
        const amount = 100;
        await badium.connect(account1).transfer(account2Addr, amount);
        expect((await badium.balanceOf(account1Addr)).toString()).to.equal(balance1Before.sub(amount).toString());
        expect((await badium.balanceOf(account2Addr)).toString()).to.equal(balance2Before.add(amount).toString());
        expect((await badium.totalSupply()).toString()).to.equal(totalSupplyBefore.toString());
    });
    it('Verify transfer requires funds', async() => {
        await expect(badium.connect(account2).transfer(account1Addr, balance2Before.add(1))).to.be.revertedWith(revertMessage('ERC20: transfer amount exceeds balance'));
        expect((await badium.balanceOf(account2Addr)).toString()).to.equal(balance2Before.toString());
    });
    it('Verify approve allow so to transfer funds from another account', async() => {
        const amount = 100;
        await badium.connect(account1).approve(deployerAddr, amount);
        expect((await badium.allowance(account1Addr, deployerAddr)).toString()).to.equal(amount.toString());
        await badium.connect(deployer).transferFrom(account1Addr, account2Addr, amount);
        expect((await badium.allowance(account1Addr, deployerAddr)).toNumber()).to.equal(0);
    });

});