// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import '../interfaces/IOwner.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import '@openzeppelin/contracts/utils/Multicall.sol';

abstract contract AbstractOwner is IOwner, Multicall {
  using EnumerableSet for EnumerableSet.AddressSet;

  // #region ***** Events *********//
  event OwnerAdded(address indexed);
  event OwnerRemoved(address indexed);
  // #endregion

  uint internal maxOwners = 50;
  EnumerableSet.AddressSet internal owners;

  modifier OnlyOwner() {
    require(owners.contains(msg.sender), 'Only owner can execute this transaction');
    _;
  }

  /// @notice Add an account to the owner role
  /// @param _address address of new owner
  function _addOwner(address _address) internal returns (bool success) {
    require(owners.length() <= maxOwners, 'owners exceeded');
    success = owners.add(_address);
    emit OwnerAdded(_address);
  }

  /// @notice Add an account to the owner role
  /// @param _address address of new owner
  function addOwner(address _address) public virtual OnlyOwner returns (bool success) {
    return _addOwner(_address);
  }

  /// @notice Remove an account from the owner role
  /// @param _address address of existing owner
  function removeOwner(address _address) public virtual OnlyOwner returns (bool success) {
    success = owners.remove(_address);
    emit OwnerRemoved(_address);
  }

  function ownerCount() public view returns (uint) {
    return owners.length();
  }

  function isOwner(address _address) public view returns (bool) {
    return owners.contains(_address);
  }

  function listOwners() public view returns (address[] memory) {
    return owners.values();
  }
}
