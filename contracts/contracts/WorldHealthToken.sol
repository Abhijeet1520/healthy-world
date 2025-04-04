// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WorldHealthToken
 * @dev ERC20 token for the HealthyWorld app (WLD).
 *
 * This token is designed to reward participants for completing challenges or health goals.
 * - The contract owner can add authorized minters.
 * - The contract owner can designate a rewards controller, who can directly mint rewards via `mintRewards`.
 */
contract WorldHealthToken is ERC20, Ownable {
    // Address that can mint rewards (e.g., a contract or backend server that calculates user achievements)
    address public rewardsController;

    // Mapping of addresses that are allowed to mint tokens, other than the owner
    mapping(address => bool) public authorizedMinters;

    // -----------------------
    //         EVENTS
    // -----------------------
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event RewardsControllerSet(address indexed controller);

    /**
     * @dev Constructor to initialize the token supply and set the name/symbol.
     * @param initialSupply Initial number of tokens (multiplied by 10^decimals) minted to the contract deployer.
     */
    constructor(uint256 initialSupply) ERC20("World Health Token", "WLD") {
        _mint(msg.sender, initialSupply * 10**decimals());
    }

    /**
     * @dev Grants an address the privilege to mint tokens (via `mint`).
     * @param minter Address of the new minter.
     */
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        authorizedMinters[minter] = true;
        emit MinterAdded(minter);
    }

    /**
     * @dev Revokes an address's privilege to mint tokens.
     * @param minter Address of the minter to revoke.
     */
    function removeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRemoved(minter);
    }

    /**
     * @dev Sets the rewardsController, which can call `mintRewards`.
     * @param controller Address of the new rewards controller.
     */
    function setRewardsController(address controller) external onlyOwner {
        require(controller != address(0), "Invalid controller address");
        rewardsController = controller;
        emit RewardsControllerSet(controller);
    }

    /**
     * @dev Mints tokens (only authorized minters or the owner can do this).
     * @param to Address to receive the newly minted tokens.
     * @param amount Number of tokens to mint (in the smallest unit, i.e., wei for tokens).
     */
    function mint(address to, uint256 amount) external {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _mint(to, amount);
    }

    /**
     * @dev Mints tokens as rewards (only the rewards controller can call this).
     * @param to Address to receive the reward tokens.
     * @param amount Number of tokens to mint as a reward.
     */
    function mintRewards(address to, uint256 amount) external {
        require(msg.sender == rewardsController, "Only rewards controller can mint rewards");
        _mint(to, amount);
    }

    /**
     * @dev Allows anyone to burn tokens from their own balance.
     * @param amount Number of tokens to burn.
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
