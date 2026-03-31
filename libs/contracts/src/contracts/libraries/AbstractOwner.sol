// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import '../interfaces/IOwner.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import '@openzeppelin/contracts/utils/Multicall.sol';

/**
 * @title AbstractOwner
 * @dev This abstract contract manages ownership of the contract. It allows for adding and removing
 * owners, and provides modifiers to restrict access to certain functions to only owners.
 */
abstract contract AbstractOwner is IOwner, Multicall {
  using EnumerableSet for EnumerableSet.AddressSet;

  // #region ***** Events *********//
  event OwnerAdded(address indexed);
  event OwnerRemoved(address indexed);
  // #endregion

  uint internal maxOwners = 50; // Maximum number of owners allowed
  EnumerableSet.AddressSet internal owners; // Set of owner addresses

  /**
   * @dev Modifier that checks if the caller is an owner.
   * Requirements:
   * - The caller must be an owner.
   */
  modifier OnlyOwner() {
    require(
      owners.contains(msg.sender),
      'Only owner can execute this transaction'
    );
    _;
  }

  /**
   * @notice Adds an account to the owner role.
   * @param _address The address of the new owner.
   * @return success A boolean indicating if the operation was successful.
   * Requirements:
   * - The number of owners must not exceed the maximum limit.
   */
  function _addOwner(address _address) internal returns (bool success) {
    require(owners.length() <= maxOwners, 'owners exceeded');
    success = owners.add(_address);
    emit OwnerAdded(_address);
  }

  /**
   * @notice Adds an account to the owner role.
   * @param _address The address of the new owner.
   * @return success A boolean indicating if the operation was successful.
   * Requirements:
   * - The caller must be an owner.
   */
  function addOwner(
    address _address
  ) public virtual OnlyOwner returns (bool success) {
    return _addOwner(_address);
  }

  /**
   * @notice Removes an account from the owner role.
   * @param _address The address of the existing owner to remove.
   * @return success A boolean indicating if the operation was successful.
   * Requirements:
   * - The caller must be an owner.
   */
  function removeOwner(
    address _address
  ) public virtual OnlyOwner returns (bool success) {
    success = owners.remove(_address);
    emit OwnerRemoved(_address);
  }

  /**
   * @dev Returns the count of current owners.
   * @return The number of owners.
   */
  function ownerCount() public view returns (uint) {
    return owners.length();
  }

  /**
   * @dev Checks if a given address is an owner.
   * @param _address The address to check.
   * @return True if the address is an owner, false otherwise.
   */
  function isOwner(address _address) public view returns (bool) {
    return owners.contains(_address);
  }

  /**
   * @dev Lists all current owners.
   * @return An array of addresses representing the current owners.
   */
  function listOwners() public view returns (address[] memory) {
    return owners.values();
  }
}
