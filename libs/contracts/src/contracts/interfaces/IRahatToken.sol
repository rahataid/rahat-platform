//SPDX-License-Identifier: LGPL-3.0
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './IOwner.sol';

interface IRahatToken is IERC20 {
  function mint(address _to, uint256 _amount) external returns (uint256);
}
