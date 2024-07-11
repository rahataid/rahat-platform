//SPDX-License-Identifier: LGPL-3.0
pragma solidity ^0.8.17;

interface IOwner {
  function addOwner(address _account) external returns (bool);

  function removeOwner(address _account) external returns (bool);

  function ownerCount() external view returns (uint);

  function isOwner(address _address) external view returns (bool);

  function listOwners() external view returns (address[] memory);
}
