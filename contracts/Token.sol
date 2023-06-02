// SPDX-License-Identifier: GPL3.0
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20, Ownable {
    uint256 public constant reward = 100 * 1e18;

    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol){}

    function mintReward(address _user) external onlyOwner {
        _mint(_user, reward);
    }
}
