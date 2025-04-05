// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

/**
 * @dev Import the official BaseRegistrarImplementation from ENS.
 * Make sure you have "@ensdomains/ens-contracts" installed.
 */
import "@ensdomains/ens-contracts/contracts/registry/ENS.sol";
import "@ensdomains/ens-contracts/contracts/ethregistrar/BaseRegistrarImplementation.sol";

/**
 * @title BaseRegistrarImplementationExtended
 * @notice This contract extends the official ENS BaseRegistrarImplementation
 *         by adding extra functionality (e.g. achievements) without duplicating code.
 */
contract HealthyWorldRegistrarImplementation is BaseRegistrarImplementation {
    /**
     * @dev A simple struct representing an achievement.
     *      You can expand this with more fields if desired (timestamp, metadata, etc.).
     */
    struct Achievement {
        string title;
        string description;
    }

    /// @notice Maps each address to an array of Achievements they've received.
    mapping(address => Achievement[]) private userAchievements;

    /**
     * @dev Emitted when a new achievement is awarded to a user.
     */
    event AchievementAwarded(
        address indexed user,
        string title,
        string description
    );

    /**
     * @notice The constructor must call the parent constructor(s) properly.
     * @param _ens The ENS registry address.
     * @param _baseNode The namehash of the TLD (e.g., .eth) this registrar owns.
     */
    constructor(ENS _ens, bytes32 _baseNode)
        BaseRegistrarImplementation(_ens, _baseNode)
        // The BaseRegistrarImplementation constructor already calls ERC721("") internally
    {
        // Any additional setup can go here if needed.
    }

    /**
     * @notice Awards an achievement to a given user (i.e., someone holding a domain).
     *         Must be called by an authorized controller or the contract owner.
     * @param user The address of the user to receive the achievement.
     * @param title A short title for the achievement.
     * @param description A description or metadata about the achievement.
     */
    function awardAchievement(
        address user,
        string calldata title,
        string calldata description
    ) external onlyController {
        // (Optional) You could check if `user` actually owns at least one name in this registrar:
        // e.g. require(balanceOf(user) > 0, "User doesn't own any name");
        // But for now, we'll just store it unconditionally.

        userAchievements[user].push(Achievement(title, description));

        emit AchievementAwarded(user, title, description);
    }

    /**
     * @notice Returns a list of all achievements awarded to the specified user.
     * @param user The address whose achievements to retrieve.
     * @return An array of Achievement structs with title and description.
     */
    function getAchievements(
        address user
    ) external view returns (Achievement[] memory) {
        return userAchievements[user];
    }

}
