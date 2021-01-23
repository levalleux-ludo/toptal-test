//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

/**
 * @dev Badium Token implementation.
 */
contract Badium is Ownable, ERC20Burnable {
  using EnumerableSet for EnumerableSet.AddressSet;

  EnumerableSet.AddressSet private accountsSet;

  /**
     * @dev Create the contract with the given parameters
     */
  constructor(string memory name_, string memory symbol_, uint8 decimals_) 
  Ownable() ERC20(name_, symbol_)
  {
    _setupDecimals(decimals_);
  }

    /**
     * @dev Destroys all tokens
     *
     * Emits a {Transfer} event for each not-empty account with `to` set to the zero address.
     *
     */
  function burnAll() external onlyOwner {
    for (uint i = 0; i < accountsSet.length(); i++) {
      address account = accountsSet.at(i);
      uint256 balance = balanceOf(account);
      _burn(account, balance);
    }
    assert(totalSupply() == 0);
  }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     */
  function mint(address to, uint256 amount) external onlyOwner  {
      _mint(to, amount);
  }

    /**
     * @dev Hook that is called before any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * will be to transferred to `to`.
     * - when `from` is zero, `amount` tokens will be minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
  function _beforeTokenTransfer(address from, address to, uint256 amount) override internal  { 
    if (to != address(0)) {
        accountsSet.add(to);
    }
  }


}
