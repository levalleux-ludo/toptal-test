//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

contract Badium is Ownable, ERC20Burnable {
  using EnumerableSet for EnumerableSet.AddressSet;

  EnumerableSet.AddressSet private accountsSet;

  constructor(string memory name_, string memory symbol_, uint8 decimals_, uint256 initialSupply_, address initialOwner_) 
  Ownable() ERC20(name_, symbol_)
  {
    _setupDecimals(decimals_);
    _mint(initialOwner_, initialSupply_);
  }

  function burnAll() external onlyOwner {
    for (uint i = 0; i < accountsSet.length(); i++) {
      address account = accountsSet.at(i);
      uint256 balance = balanceOf(account);
      _burn(account, balance);
    }
    assert(totalSupply() == 0);
  }

  function mint(address to, uint256 amount) external onlyOwner  {
      _mint(to, amount);
  }

  function _beforeTokenTransfer(address from, address to, uint256 amount) override internal  { 
    if (to != address(0)) {
        accountsSet.add(to);
    }
  }


}
