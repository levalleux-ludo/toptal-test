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
        decimals);
    await badium.deployed();
    await badium.mint(
        initialOwner,
        hre.ethers.BigNumber.from(initialSupply).mul(hre.ethers.BigNumber.from(10).pow(decimals))
    );
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
        balanceDeployerBefore = await badium.balanceOf(deployerAddr);
        totalSupplyBefore = await badium.totalSupply();
        // Requirement: recipient accounts must be in eligible receivers list
        await badium.connect(deployer).addReceiver(account1Addr);
        await badium.connect(deployer).addReceiver(account2Addr);
    });
    it('Verify initial balances', async() => {
        expect(balanceDeployerBefore.toNumber()).to.equal(0);
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
        await badium.connect(account1).approve(account2Addr, amount);
        expect((await badium.allowance(account1Addr, account2Addr)).toString()).to.equal(amount.toString());
        await badium.connect(account2).transferFrom(account1Addr, account2Addr, amount);
        expect((await badium.allowance(account1Addr, account2Addr)).toNumber()).to.equal(0);
    });
    it('Verify insufficient allowance does not allow so to transfer funds from another account', async() => {
        const amount = 100;
        await badium.connect(account1).approve(account2Addr, amount - 1);
        expect((await badium.allowance(account1Addr, account2Addr)).lt(amount)).to.be.true;
        await expect(badium.connect(account2).transferFrom(account1Addr, account2Addr, amount)).to.be.revertedWith(revertMessage('ERC20: transfer amount exceeds allowance'));
        expect((await badium.allowance(account1Addr, account2Addr)).eq(amount - 1)).to.be.true;
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

});

describe('Badium Token Transfer Features', async() => {
    before('', async() => {
        await initTestVariables();
        await createContract();
    });
    beforeEach('update balances', async() => {
        balance1Before = await badium.balanceOf(account1Addr);
        balance2Before = await badium.balanceOf(account2Addr);
        balanceDeployerBefore = await badium.balanceOf(deployerAddr);
        totalSupplyBefore = await badium.totalSupply();
    });
    it('Verify initial balances', async() => {
        expect(balanceDeployerBefore.toNumber()).to.equal(0);
        expect(balance1Before.toString()).to.equal(initialSupply.toString() + '0'.repeat(decimals));
        expect(balance2Before.toNumber()).to.equal(0);
    });
    it('The owner can transfer N tokens from Addr1 to Addr2', async() => {
        const amount = 100;
        expect(balance1Before.gt(0)).to.be.true;
        expect(balance2Before.eq(0)).to.be.true;
        await badium.connect(deployer).transferFrom(account1Addr, account2Addr, amount);
        const balance1After = await badium.balanceOf(account1Addr);
        const balance2After = await badium.balanceOf(account2Addr);
        expect(balance1Before.sub(balance1After).eq(amount)).to.be.true;
        expect(balance2After.eq(amount)).to.be.true;
        expect((await badium.totalSupply()).eq(totalSupplyBefore)).to.be.true;
    });
    it('The owner can add an account in the list of eligible receivers', async() => {
        expect(await badium.canReceive(account1Addr)).to.be.false;
        const nbReceivers = await await badium.nbReceivers();
        await badium.connect(deployer).addReceiver(account1Addr);
        expect(await badium.canReceive(account1Addr)).to.be.true;
        expect((await badium.nbReceivers()).eq(nbReceivers.add(1))).to.be.true;
        expect(await badium.getReceiverAtIndex(0)).to.equal(account1Addr);
    });
    it('Another user can not add a receiver the list of eligible receivers', async() => {
        expect(await badium.canReceive(account2Addr)).to.be.false;
        const nbReceivers = await await badium.nbReceivers();
        await expect(badium.connect(account1).addReceiver(account2Addr)).to.be.revertedWith(revertMessage('Ownable: caller is not the owner'));
        expect(await badium.canReceive(account2Addr)).to.be.false;
        expect((await badium.nbReceivers()).eq(nbReceivers)).to.be.true;
        await badium.connect(deployer).addReceiver(account2Addr);
        expect(await badium.canReceive(account2Addr)).to.be.true;
        expect((await badium.nbReceivers()).eq(nbReceivers.add(1))).to.be.true;
        expect(await badium.getReceiverAtIndex(nbReceivers)).to.equal(account2Addr);
    });
    it('addReceiver robustness', async() => {
        // verify that adding a receiver already present has no effect
        expect(await badium.canReceive(account1Addr)).to.be.true;
        const nbReceivers = await await badium.nbReceivers();
        expect(await badium.getReceiverAtIndex(0)).to.equal(account1Addr);
        await badium.connect(deployer).addReceiver(account1Addr);
        expect(await badium.canReceive(account1Addr)).to.be.true;
        expect((await badium.nbReceivers()).eq(nbReceivers)).to.be.true;
        expect(await badium.getReceiverAtIndex(0)).to.equal(account1Addr);
    });
    it('The owner can remove an account in the list of eligible receivers', async() => {
        expect(await badium.canReceive(account1Addr)).to.be.true;
        expect(await badium.canReceive(account2Addr)).to.be.true;
        const nbReceivers = await await badium.nbReceivers();
        await badium.connect(deployer).removeReceiver(account1Addr);
        expect(await badium.canReceive(account1Addr)).to.be.false;
        expect(await badium.canReceive(account2Addr)).to.be.true;
        expect(await badium.getReceiverAtIndex(0)).to.equal(account2Addr);
        expect((await badium.nbReceivers()).eq(nbReceivers.sub(1))).to.be.true;
        await expect(badium.getReceiverAtIndex(nbReceivers.sub(1))).to.be.revertedWith(revertMessage('EnumerableSet: index out of bounds'));
    });
    it('removeReceiver robustness', async() => {
        // verify that removing a receiver already absent has no effect
        expect(await badium.canReceive(account1Addr)).to.be.false;
        const nbReceivers = await await badium.nbReceivers();
        await badium.connect(deployer).removeReceiver(account1Addr);
        expect(await badium.canReceive(account1Addr)).to.be.false;
        expect((await badium.nbReceivers()).eq(nbReceivers)).to.be.true;
    });
    it('Another user can not remove a receiver from the list of eligible receivers', async() => {
        expect(await badium.canReceive(account2Addr)).to.be.true;
        await expect(badium.connect(account1).removeReceiver(account2Addr)).to.be.revertedWith(revertMessage('Ownable: caller is not the owner'));
        expect(await badium.canReceive(account2Addr)).to.be.true;
    });
    it('A user cannot transfer his own tokens to another address if not in eligible receiver', async() => {
        expect(balance2Before.gt(0)).to.be.true;
        expect(await badium.canReceive(account1Addr)).to.be.false;
        await expect(badium.connect(account2).transfer(account1Addr, balance2Before)).to.be.revertedWith(revertMessage('Badium: recipient not in eligible receivers'));
        expect((await badium.balanceOf(account2Addr)).eq(balance2Before)).to.be.true;
    })
    it('A user can transfer his own tokens to another address if in eligible receiver', async() => {
        await badium.connect(deployer).addReceiver(account1Addr);
        expect(balance2Before.gt(0)).to.be.true;
        expect(await badium.canReceive(account1Addr)).to.be.true;
        await badium.connect(account2).transfer(account1Addr, balance2Before);
        expect((await badium.balanceOf(account2Addr)).eq(0)).to.be.true;
        expect((await badium.balanceOf(account1Addr)).eq(balance1Before.add(balance2Before))).to.be.true;
    })
    it('The owner can transfer N tokens from Addr1 to Addr2 even if Addr2 is not in eligible receiver', async() => {
        const amount = 100;
        await badium.connect(deployer).removeReceiver(account2Addr);
        expect(await badium.canReceive(account2Addr)).to.be.false;
        expect(balance1Before.gt(amount)).to.be.true;
        await badium.connect(deployer).transferFrom(account1Addr, account2Addr, amount);
        expect((await badium.balanceOf(account2Addr)).eq(balance2Before.add(amount))).to.be.true;
        expect((await badium.balanceOf(account1Addr)).eq(balance1Before.sub(amount))).to.be.true;
    })

})