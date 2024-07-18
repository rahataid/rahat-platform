//SPDX-License-Identifier: LGPL-3.0
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/utils/introspection/IERC165.sol';

interface IRahatProject is IERC165 {
  function name() external view returns (string memory);

  function totalAllocated() external view returns (uint256);

  function tokenAllocations(
    address _token,
    address _address
  ) external view returns (uint);

  function transferTokenToClaimer(
    address _tokenAddress,
    address _benAddress,
    address _vendorAddress,
    uint _amount
  ) external;
}
