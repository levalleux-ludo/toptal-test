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

  // The list of known accounts (with a balance that has been positive), used to burn all tokens
  EnumerableSet.AddressSet private accountsSet;
  // The list of eligible receivers
  EnumerableSet.AddressSet private receiversSet;
  // The buyer contract that is allowed to transfer token to a recipient that is not in receivers list
  address public buyerContract;

  /**
     * @dev Create the contract with the given parameters
     */
  constructor(string memory name_, string memory symbol_, uint8 decimals_) 
  Ownable() ERC20(name_, symbol_)
  {
    _setupDecimals(decimals_);
  }

  function setBuyerContract(address buyerContract_) external onlyOwner {
    buyerContract = buyerContract_;
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
     * @dev Overriden implementation of transferFrom, wrt requirement #xx: The owner can transfer tokens from one address to another
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * Requirements:
     *
     * - `sender` and `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     * - the caller must be the contract's owner
     *  or have allowance for ``sender``'s tokens of at least
     * `amount`.
     */
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        if (_msgSender() == owner()) {
          // transferFrom without allowance check
          _transfer(sender, recipient, amount);
        } else {
          // Standard transferFrom
          super.transferFrom(sender, recipient, amount);
        }
        return true;
    }

    function addReceiver(address receiver) external onlyOwner {
      receiversSet.add(receiver);
    }

    function removeReceiver(address receiver) external onlyOwner {
      receiversSet.remove(receiver);
    }

    function nbReceivers() public view returns (uint256) {
      return receiversSet.length();
    }

    function canReceive(address account) public view returns (bool) {
      return receiversSet.contains(account);
    }

    function getReceiverAtIndex(uint256 index) external view returns (address) {
      return receiversSet.at(index);
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
        // Only the contract owner or the buyer contract are allowed to transfer to a recipient that is not in the receivers list
      if ((_msgSender() != owner()) && (_msgSender() != buyerContract)) {
        // Check the recipient is in eligible list
        require(canReceive(to), "Badium: recipient not in eligible receivers");
      }
    }
  }


}
