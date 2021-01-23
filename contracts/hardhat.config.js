require("@nomiclabs/hardhat-waffle");
require('hardhat-docgen');
require('hardhat-contract-sizer');


const dotenvConfig = require('dotenv').config;
// import { config as dotenvConfig } from "dotenv";
const resolve = require('path').resolve;
// import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "./.env") });

if (!process.env.MNEMONIC) {
    throw new Error("Please set your MNEMONIC in a .env file");
}


// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async() => {
    const accounts = await ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: "0.7.3",
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {},
        ganache: {
            chainId: 1337,
            url: "http://192.168.1.11:7545",
            accounts: {
                count: 10,
                initialIndex: 0,
                mnemonic: process.env.MNEMONIC,
                path: "m/44'/60'/0'/0",
            },
        },
        matic: {
            chainId: 137,
            url: `https://rpc-mainnet.matic.today`,
            accounts: {
                count: 10,
                initialIndex: 0,
                mnemonic: process.env.MNEMONIC,
                path: "m/44'/60'/0'/0",
            },
        },
        mumbai: {
            chainId: 80001,
            url: `https://rpc-mumbai.matic.today`,
            accounts: {
                count: 10,
                initialIndex: 0,
                mnemonic: process.env.MNEMONIC,
                path: "m/44'/60'/0'/0",
            },
        }
    },
    docgen: {
        path: './docs',
        clear: true,
        runOnCompile: true,
    },
    contractSizer: {
        alphaSort: true,
        runOnCompile: true,
        disambiguatePaths: false,
    },
};