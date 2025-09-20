// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC contract for testing purposes
 */
contract MockUSDC is ERC20 {
    
    constructor() ERC20("Mock USDC", "USDC") {
        // Mint initial supply to deployer for testing
        _mint(msg.sender, 1000000 * 10**decimals()); // 1 million USDC
    }
    
    /**
     * @dev Mint tokens for testing (anyone can mint in this mock)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    /**
     * @dev Returns 6 decimals like real USDC
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}