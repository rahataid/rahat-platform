//SPDX-License-Identifier: LGPL-3.0
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/utils/introspection/IERC165.sol';

interface IRahatTreasury is IERC165 {
  function createToken(
    string memory _name,
    string memory _symbol,
    uint8 decimals
  ) external;

  function mintToken(address _token, uint256 _amount) external;

  function mintTokenAndApprove(
    address _token,
    address _approveAddress,
    uint256 _amount
  ) external;

  function addTokenOwner(address _token, address _ownerAddress) external;
}
