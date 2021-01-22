//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Badium is Ownable, ERC20Burnable {

  constructor(string memory name_, string memory symbol_, uint8 decimals_, uint256 initialSupply_, address initialOwner_) 
  Ownable() ERC20(name_, symbol_)
  {
    _setupDecimals(decimals_);
    _mint(initialOwner_, initialSupply_);
  }

}
