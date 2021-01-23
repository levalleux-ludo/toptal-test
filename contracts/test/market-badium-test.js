const { expect } = require("chai");
const { BigNumber } = require("ethers");
const hre = require("hardhat");
const { revertMessage } = require("./utils");
const ethers = hre.ethers;

let deployer, account1, account2;
let deployerAddr, account1Addr, account2Addr;
let initialOwner;
let MarketFactory, BadiumFactory;
let market, badium;
const tokenName = 'Badium';
const tokenSymbol = 'BAD';
const decimals = 18;
const initialSupply = 10000000;
const tokenPrice = ethers.constants.WeiPerEther.div(100); // 0.01 ETH
async function initTestVariables() {
    [deployer, account1, account2] = await ethers.getSigners();
    deployerAddr = await deployer.getAddress();
    account1Addr = await account1.getAddress();
    account2Addr = await account2.getAddress();
    MarketFactory = await ethers.getContractFactory("Market");
    BadiumFactory = await ethers.getContractFactory("Badium");
    initialOwner = account1Addr;
}
async function createContracts() {
    badium = await BadiumFactory.deploy(
        tokenName,
        tokenSymbol,
        decimals);
    await badium.deployed();
    market = await MarketFactory.deploy(tokenPrice, badium.address);
    await market.deployed();
    await badium.mint(
        market.address,
        hre.ethers.BigNumber.from(initialSupply).mul(hre.ethers.BigNumber.from(10).pow(decimals))
    );
}

describe('Buying token/token price', async() => {
    before('', async() => {
        await initTestVariables();
        await createContracts();
    });
    it('A user can call the contract to know the price to be paid for a given amount of BAD tokens', async() => {
        const tokenPrice = await market.tokenPrice();
        const amount_bad = 15.5;
        const amount_bad_unit = BigNumber.from(10).pow(decimals).mul(amount_bad * 1000000).div(1000000);
        const expected_price = tokenPrice.mul(amount_bad * 1000000).div(1000000);
        expect((await market.computePrice(amount_bad_unit)).toString()).to.equal(expected_price.toString())
    });
    it('A user can buy a given amount of tokens at a price of 0.01 ETH', async() => {
        const ethBalance2Before = await account2.getBalance();
        const badBalance2Before = await badium.balanceOf(account2Addr);
        const tokenPrice = await market.tokenPrice();
        const amount_bad = 15.5;
        const amount_bad_unit = BigNumber.from(10).pow(decimals).mul(amount_bad * 1000000).div(1000000);
        const expected_price = await market.computePrice(amount_bad_unit);
        await market.connect(account2).buy(amount_bad_unit, { value: expected_price });
        const ethBalance2After = await account2.getBalance()
        expect(ethBalance2After.lt(ethBalance2Before.sub(expected_price))).to.be.true;
        expect((await badium.balanceOf(account2Addr)).toString()).to.equal(badBalance2Before.add(amount_bad_unit).toString())
    });
    it('A user cannot buy more tokens that the balance of the contract itself (total supply – amount of tokens already sold / transferred)', async() => {
        // Empty the token contract and mint only a few amount of token
        await badium.connect(deployer).burnAll();
        await badium.connect(deployer).mint(market.address, 100 * 10 ** 6);
        expect((await badium.totalSupply()).toString()).to.equal('100' + '0'.repeat(6));
        const tokenPrice = await market.tokenPrice();
        const amount_bad_unit = 51 * 10 ** 6;
        const expected_price = await market.computePrice(amount_bad_unit);
        console.log(amount_bad_unit, tokenPrice.toString(), expected_price.toString());
        // First purchase order is expected to complete
        await market.connect(account2).buy(amount_bad_unit, { value: expected_price });
        // Sencond order is expected to fail because there is not enough remaining tokens
        await expect(market.connect(account2).buy(amount_bad_unit, { value: expected_price })).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });
    it('The owner can change the token price (in wei)', async() => {
        const oldTokenPrice = await market.tokenPrice();
        const amount_bad_unit = 51 * 10 ** 6;
        const expected_price = await market.computePrice(amount_bad_unit);
        const newPrice = oldTokenPrice.mul(2);
        const new_expected_price = expected_price.mul(2);
        await market.connect(deployer).setTokenPrice(newPrice);
        expect((await market.tokenPrice()).toString()).to.equal(oldTokenPrice.mul(2).toString());
        expect((await market.computePrice(amount_bad_unit)).toString()).to.equal(expected_price.mul(2).toString());
    });
    it('Another user cannot withdraw the contract balance', async() => {
        const contractBalanceBefore = await ethers.provider.getBalance(market.address);
        console.log('Withdrawing funds from Market contract', contractBalanceBefore.toString());
        expect(contractBalanceBefore.gt(0)).to.be.true;
        const userBalanceBefore = await account2.getBalance();
        await expect(market.connect(account2).withdraw()).to.be.revertedWith(revertMessage('Ownable: caller is not the owner'));
        const userBalanceAfter = await account2.getBalance();
        console.log('account2 balance', userBalanceBefore.toString(), userBalanceAfter.toString())
        expect(userBalanceAfter.gt(userBalanceBefore)).to.be.false;
        expect((await ethers.provider.getBalance(market.address)).eq(contractBalanceBefore)).to.be.true;
    });
    it('The owner can withdraw the contract balance', async() => {
        const contractBalanceBefore = await ethers.provider.getBalance(market.address);
        console.log('Withdrawing funds from Market contract', contractBalanceBefore.toString());
        expect(contractBalanceBefore.gt(0)).to.be.true;
        const deployerBalanceBefore = await deployer.getBalance();
        await market.connect(deployer).withdraw();
        const deployerBalanceAfter = await deployer.getBalance();
        // We assume the tx fees are less than the amount that we are withdrawing
        expect(deployerBalanceAfter.gt(deployerBalanceBefore)).to.be.true;
        const contractBalanceAfter = await ethers.provider.getBalance(market.address);
        expect(contractBalanceAfter.eq(0)).to.be.true;
    });
    it('Revert when withdrawing an empty contract', async() => {
        const contractBalanceBefore = await ethers.provider.getBalance(market.address);
        expect(contractBalanceBefore.eq(0)).to.be.true;
        await expect(market.connect(deployer).withdraw()).to.be.revertedWith(revertMessage('Market: No funds to withdraw'));

    })
})