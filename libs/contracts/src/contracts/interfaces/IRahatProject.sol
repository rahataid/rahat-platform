//SPDX-License-Identifier: LGPL-3.0
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/utils/introspection/IERC165.sol';

/**
 * @title IRahatProject
 * @dev This interface defines the functions for managing a Rahat project, including
 * beneficiary management and token budget handling. It extends the IERC165 interface for interface detection.
 */
interface IRahatProject is IERC165 {
  /**
   * @notice Returns the name of the project.
   * @return The name of the project as a string.
   */
  function name() external view returns (string memory);

  /**
   * @notice Adds a new beneficiary to the project.
   * @param _address The address of the beneficiary to add.
   */
  function addBeneficiary(address _address) external;

  /**
   * @notice Removes an existing beneficiary from the project.
   * @param _address The address of the beneficiary to remove.
   */
  function removeBeneficiary(address _address) external;

  /**
   * @notice Checks if a given address is a beneficiary of the project.
   * @param _address The address to check.
   * @return True if the address is a beneficiary, false otherwise.
   */
  function isBeneficiary(address _address) external view returns (bool);

  /**
   * @notice Returns the total number of beneficiaries in the project.
   * @return The count of beneficiaries.
   */
  function beneficiaryCount() external view returns (uint256);

  /**
   * @notice Returns the budget allocated for a specific token address.
   * @param _tokenAddress The address of the token to query.
   * @return The budget allocated for the specified token.
   */
  function tokenBudget(address _tokenAddress) external view returns (uint);
}
