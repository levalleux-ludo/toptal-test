const { expect } = require("chai");
const { BigNumber } = require("ethers");
const hre = require("hardhat");
const { revertMessage } = require("./utils");
const ethers = hre.ethers;

let deployer, account1, account2;
let deployerAddr, account1Addr, account2Addr;
let initialOwner;
let BadiumFactory;
let badium;
const tokenName = 'Badium';
const tokenSymbol = 'BAD';
const decimals = 18;
const initialSupply = 10000000;

async function initTestVariables() {
    [deployer, account1, account2] = await ethers.getSigners();
    deployerAddr = await deployer.getAddress();
    account1Addr = await account1.getAddress();
    account2Addr = await account2.getAddress();
    BadiumFactory = await ethers.getContractFactory("Badium");
    initialOwner = account1Addr;
}

async function createContract() {
    badium = await BadiumFactory.deploy(
        tokenName,
        tokenSymbol,
        decimals,
        hre.ethers.BigNumber.from(initialSupply).mul(hre.ethers.BigNumber.from(10).pow(decimals)),
        initialOwner);

    await badium.deployed();
}

describe("Badium Token Deployment", async() => {
    before('', async() => {
        await initTestVariables();
    })
    it("Should verify that the token contract is deployed", async() => {
        await createContract();
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
    before('', async() => {
        await initTestVariables();
        await createContract();
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

describe('Badium Ownership', async() => {
    before('', async() => {
        await initTestVariables();
        await createContract();
    });
    it('Verify initial owner', async() => {
        expect(await badium.owner()).to.equal(deployerAddr);
    });
    it('The owner can transfer the contract ownership to another account', async() => {
        await badium.connect(deployer).transferOwnership(account1Addr);
        expect(await badium.owner()).to.equal(account1Addr);
    });
    it('Another user cannot transfer the contract ownership to another account', async() => {
        await expect(badium.connect(deployer).transferOwnership(account2Addr)).to.be.revertedWith(revertMessage('Ownable: caller is not the owner'));
    });
});

describe('Badium total supply / mint / burn', async() => {
    before('', async() => {
        await initTestVariables();
        await createContract();
    });
    it('Verify totalSupply', async() => {
        expect((await badium.totalSupply()).toString()).to.equal(initialSupply.toString() + '0'.repeat(decimals));
    });
    it('Verify Another user can not burn all tokens', async() => {
        await expect(badium.connect(account1).burnAll()).to.be.revertedWith(revertMessage('Ownable: caller is not the owner'));
    });
    it('Verify The owner can burn all tokens', async() => {
        expect(await badium.owner()).to.equal(deployerAddr);
        expect((await badium.balanceOf(account1Addr)).toString()).to.not.equal('0');
        await badium.connect(deployer).burnAll();
        expect((await badium.totalSupply()).toString()).to.equal('0');
        expect((await badium.balanceOf(deployerAddr)).toNumber()).to.equal(0);
        expect((await badium.balanceOf(account1Addr)).toString()).to.equal('0');
        expect((await badium.balanceOf(account2Addr)).toNumber()).to.equal(0);
    });
    it('Verify The owner can burn all tokens again', async() => {
        expect(await badium.owner()).to.equal(deployerAddr);
        expect((await badium.balanceOf(account1Addr)).toString()).to.equal('0');
        await badium.connect(deployer).burnAll();
        expect((await badium.totalSupply()).toString()).to.equal('0');
        expect((await badium.balanceOf(deployerAddr)).toNumber()).to.equal(0);
        expect((await badium.balanceOf(account1Addr)).toString()).to.equal('0');
        expect((await badium.balanceOf(account2Addr)).toNumber()).to.equal(0);
    });
    it('Verify The token contract owner can mint N tokens, hence increasing the total supply', async() => {
        const amountToMint = BigNumber.from(2 ** 32 - 1).mul(BigNumber.from(10).pow(18));
        const accountTo = account1Addr;
        expect(await badium.owner()).to.equal(deployerAddr);
        const totalSupplyBefore = await badium.totalSupply();
        const balance1Before = await badium.balanceOf(accountTo);
        await badium.connect(deployer).mint(accountTo, amountToMint);
        expect((await badium.totalSupply()).toString()).to.equal(totalSupplyBefore.add(amountToMint).toString());
        expect((await badium.balanceOf(accountTo)).toString()).to.equal(balance1Before.add(amountToMint).toString());
    });
    it('Verify Another user cannot mint tokens', async() => {
        const amountToMint = BigNumber.from(2 ** 32 - 1).mul(BigNumber.from(10).pow(18));
        const accountTo = account1Addr;
        expect(await badium.owner()).to.equal(deployerAddr);
        const totalSupplyBefore = await badium.totalSupply();
        const balance1Before = await badium.balanceOf(accountTo);
        await expect(badium.connect(account1).mint(accountTo, amountToMint)).to.be.revertedWith(revertMessage('Ownable: caller is not the owner'));
        expect((await badium.totalSupply()).toString()).to.equal(totalSupplyBefore.toString());
        expect((await badium.balanceOf(accountTo)).toString()).to.equal(balance1Before.toString());
    });

})