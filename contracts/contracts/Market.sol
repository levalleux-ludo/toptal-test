//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "hardhat/console.sol";
import "./Badium.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Market is Ownable {
    using SafeMath for uint256;

    /**
     * @dev The price of a token in wei (1 ETH = 10^18 wei)
     */
    uint256 public tokenPrice; // the price of a token in wei (1 ETH = 10^18 wei)
    /**
     * @dev The adress of the token contract
     */
    address public tokenContract;

    /**
     * @dev Build the market contract for the specified token contract with the specified token price
     *
     * Parameters:
     * - tokenPrice_: the price of 1 token in wei
     * - tokenContract_: the address of the token contract
     */
    constructor(uint256 tokenPrice_, address tokenContract_) Ownable() {
        tokenPrice = tokenPrice_;
        tokenContract = tokenContract_;
    }

    /**
     * - @dev Purchase a given amount of tokens.
     *
     * The tokens are transferred to the caller if and only if the transaction pays the expected price for the amount.
     *
     * Arguments:
     * - amount: the amount of token purchased in base units (times the token decimals)
     *
     * If the payment exceed the requested price, the surplus is paid back to the sender
     *
     */
    function buy(uint256 amount) external payable {
        uint256 requestedPrice = computePrice(amount);
        require(
            (msg.value >= requestedPrice),
            "Market: Transaction payment is too low."
        );
        require(Badium(tokenContract).transfer(msg.sender, amount));
        if (msg.value > requestedPrice) {
            msg.sender.transfer(msg.value - requestedPrice);
        }
    }

    /** 
    * @dev Compute the price of a given amount of BAD token
     *
     * Arguments:
     * - amount: the amount of token to be quoted in base units (times the token decimals)
     *
     */
    function computePrice(uint256 amount) public view returns (uint256 requestedPrice) {
        uint256 decimals = Badium(tokenContract).decimals();
        requestedPrice = amount.mul(tokenPrice).div(10**decimals);

    }

    /**
    * @dev Allow the contract's owner to withdraw the funds owned by the contract
     */
    function withdraw() external onlyOwner {
        require(address(this).balance > 0, "Market: No funds to withdraw");
        msg.sender.transfer(address(this).balance);
    }


    /**
    * @dev Allow the contract's owner to set the unit price of a BAD token
    *
    * Arguments:
    * - newTokenPrice: the price of a BAD token in wei
    *
    */
    function setTokenPrice(uint256 newTokenPrice) external onlyOwner {
        tokenPrice = newTokenPrice;
        // TODO raise event ?
    }
}
