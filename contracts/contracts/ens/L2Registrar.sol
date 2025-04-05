// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {StringUtils} from "@ensdomains/ens-contracts/utils/StringUtils.sol";
import {IL2Registry} from "./interfaces/IL2Registry.sol";

/// @dev L2 registrar contract that can store multiple user details in text records.
contract L2Registrar {
    using StringUtils for string;

    /// @notice Emitted when a new name is registered
    /// @param label                  The subdomain label (e.g. "alice" for "alice.myname.eth")
    /// @param owner                  Owner of the newly registered subdomain
    /// @param username               Basic username
    /// @param fullName               Full name
    /// @param bio                    Short description or bio
    /// @param challengesParticipated How many or which challenges the user participated in
    /// @param rewards                Short string describing user’s rewards
    /// @param ranking                Could be a numeric or textual rank used for leaderboards
    event NameRegistered(
        string indexed label,
        address indexed owner,
        string username,
        string fullName,
        string bio,
        string challengesParticipated,
        string rewards,
        string ranking
    );

    /// @notice Reference to the L2 registry contract
    IL2Registry public immutable registry;

    /// @notice The chainId for the current chain
    uint256 public chainId;

    /// @notice The coinType for the current chain (ENSIP-11)
    uint256 public immutable coinType;

    /// @param _registry Address of the L2Registry contract
    constructor(address _registry) {
        assembly {
            sstore(chainId.slot, chainid())
        }

        // Derive coinType from ENSIP-11
        coinType = (0x80000000 | chainId) >> 0;
        registry = IL2Registry(_registry);
    }

    /**
     * @notice Registers a subdomain and stores extra user data.
     * @param label                  Subdomain label (e.g. "alice")
     * @param owner                  Owner of this subdomain NFT
     * @param username               Basic username
     * @param fullName               Full name
     * @param bio                    Short description or website link, etc.
     * @param challengesParticipated A string representing challenges the user joined
     * @param rewards                A string describing the user’s rewards
     * @param ranking                A string or numeric rank for leaderboards
     */
    function register(
        string calldata label,
        address owner,
        string calldata username,
        string calldata fullName,
        string calldata bio,
        string calldata challengesParticipated,
        string calldata rewards,
        string calldata ranking
    ) external {
        bytes32 node = _labelToNode(label);

        // Convert address to bytes to store with setAddr
        bytes memory addrBytes = abi.encodePacked(owner);

        // Store forward address for the current chain
        registry.setAddr(node, coinType, addrBytes);
        // Also store mainnet ETH address for convenience
        registry.setAddr(node, 60, addrBytes);

        // Create the subdomain NFT
        registry.createSubnode(
            registry.baseNode(),
            label,
            owner,
            new bytes
        );

        // Store additional info as text records
        registry.setText(node, "username", username);
        registry.setText(node, "fullName", fullName);
        registry.setText(node, "bio", bio);
        registry.setText(node, "challengesParticipated", challengesParticipated);
        registry.setText(node, "rewards", rewards);
        registry.setText(node, "ranking", ranking);

        emit NameRegistered(
            label,
            owner,
            username,
            fullName,
            bio,
            challengesParticipated,
            rewards,
            ranking
        );
    }

    /**
     * @notice Checks whether a label is available
     * @dev This is an example. Use your own logic (like payment, min length, etc.)
     */
    function available(string calldata label) external view returns (bool) {
        bytes32 node = _labelToNode(label);
        uint256 tokenId = uint256(node);

        try registry.ownerOf(tokenId) {
            // If this call doesn’t revert, name is taken
            return false;
        } catch {
            // Example rule: must be >= 3 chars
            if (label.strlen() >= 3) {
                return true;
            }
            if (bytes(label).length >= 3) {
                return true;
            }
            return false;
        }
    }

    /// @dev Utility to compute the node from the registry’s baseNode
    function _labelToNode(string calldata label) private view returns (bytes32) {
        return registry.makeNode(registry.baseNode(), label);
    }
}
