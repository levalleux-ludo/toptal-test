# Badium Token

## Requirements

Create a smart contract for a new ERC20 token called Badium (BAD). The contract needs to be deployed to testnet. The token will have following characteristics:

-   An initial total supply of 10,000,000.
-   A buying cost of 0.01 ETH per BAD.
-   The owner can burn all tokens at any time.
-   The owner can mint arbitrary amount of tokens at any time.
-   The owner can transfer tokens from one address to another.
-   The owner can specify and modify a list of eligible receivers. Once bought by users, tokens can be transferred only to those addresses.
-   Whatever parameters are not defined in the task are left for you to decide on your own, while making sure they benefit the contract’s architecture.

## Asumptions

In addition to the usecases specified in requirements, I assume that the token contract must implement all methods of the standard ERC20 interface even if not explicitly mentioned in the requirements.

The requirements ask for “a” contract, but I assume this is acceptable to rather implement the solution as a couple of contracts, composed of:

- A **token contract**, ERC20 compliant

- A **market contract** allowing users to buy the token.

This architecture decouples the token from the market actions (like buying) in order to:

- Keeps the token contract as pure as possible regarding to the ERC20 spec (state-of-the-art)

- Allows to add future features “around” the token (like auctions for instance) without having to modify the token contract (hence keeping intact the holders’ balances).

I understand from the requirements regarding the **initial total supply** that:

- This amount of 10,000,000 tokens shall be minted at the contract deployment. However, I would propose this amount to be a variable parameter instead of a hard-coded value (allowing to reuse the contract’s code for another token with a different parameter)

- These minted tokens are initially attributed to a given account: the market contract.

- When a user is buying tokens, he buys some of these pre-minted tokens. Hence, after the initial total supply of pre-minted token have been purchased (or transferred to other accounts by the owner), a user cannot buy tokens anymore, unless the owner mint new ones (increasing the total supply).

**Decimals**: Whereas ERC20 tokens are implementing the holders’ balances as integers (meaning that there is no decimal value allowed at the operation level) the common usages of tokens often require support for decimals values and I assume that it is the case for Badium. There is a convention, given for each ERC20 contract, that he’s handling operations in a “base unit” that represent a fraction of the “main unit”. Most tokens use a value of 18 for decimals (just like ETH itself). I assume the same for the Badium token, meaning that 1 BAD is 10^(18) times the “base unit”. In other terms, the tiniest decimals amount of token that is managed in transactions (hence the precision too) is 10^(-18)


## Tests list

### Ownership

- The owner can transfer the contract ownership to another account

- Another user cannot transfer the contract ownership to another account

### Total supply / mint / burn

- The initial total supply is 10000000

- The owner can burn all tokens

- Another user can not burn all tokens

- The owner can mint N tokens, hence increasing the total supply

- Another user cannot mint tokens

### Buying token/token price

- A user can buy a given amount of tokens at a price of 0.01 ETH

- A user cannot buy more tokens that the balance of the contract itself (total supply – amount of tokens already sold / transferred)

- The owner can change the token price (in ETH)

- Another user can not change the token price

- The owner can withdraw the contract’s balance

- Another user cannot withdraw the contract’s balance

### Transfer

- The owner can transfer N tokens from Addr1 to Addr2

- Another user can not transfer N tokens from Addr1 to Addr2

- The owner can set/modify the list of eligible receivers

- Another user can not set/modify the list of eligible receivers

- A user can transfer his own tokens to another address if in eligible receiver

- A user cannot transfer his own tokens to another address if not in eligible receiver

- The owner can transfer N tokens from Addr1 to Addr2 even if Addr2 is not in eligible receiver


  