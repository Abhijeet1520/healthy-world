// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WorldHealthToken
 * @dev ERC20 token for the HealthyWorld app (WLD)
 */
contract WorldHealthToken is ERC20, Ownable {
    // Rewards controller address
    address public rewardsController;
    
    // Mapping of authorized minters
    mapping(address => bool) public authorizedMinters;
    
    // Events
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event RewardsControllerSet(address indexed controller);
    
    /**
     * @dev Constructor
     * @param initialSupply Initial token supply to mint to owner
     */
    constructor(uint256 initialSupply) ERC20("World Health Token", "WLD") {
        _mint(msg.sender, initialSupply * 10**decimals());
    }
    
    /**
     * @dev Add a minter
     * @param minter Address that can mint tokens
     */
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        authorizedMinters[minter] = true;
        emit MinterAdded(minter);
    }
    
    /**
     * @dev Remove a minter
     * @param minter Address to remove minting privileges from
     */
    function removeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    /**
     * @dev Set the rewards controller
     * @param controller Address of the rewards controller
     */
    function setRewardsController(address controller) external onlyOwner {
        require(controller != address(0), "Invalid controller address");
        rewardsController = controller;
        emit RewardsControllerSet(controller);
    }
    
    /**
     * @dev Mint tokens (only callable by authorized minters)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _mint(to, amount);
    }
    
    /**
     * @dev Mint rewards tokens (only callable by rewards controller)
     * @param to Address to mint rewards to
     * @param amount Amount of rewards to mint
     */
    function mintRewards(address to, uint256 amount) external {
        require(msg.sender == rewardsController, "Only rewards controller can mint rewards");
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
} 