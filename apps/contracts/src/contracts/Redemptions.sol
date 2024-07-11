//SPDX-License-Identifier: LGPL-3.0
pragma solidity 0.8.20;

import '@openzeppelin/contracts/access/manager/AccessManaged.sol';
import '../libraries/AbstractTokenActions.sol';

/// @title Treasury contract to manage Rahat tokens and generate tokens
/// @author Rumsan Associates
/// @notice You can use this contract to manage Rahat tokens
contract Redemptions is AbstractTokenActions, AccessManaged {
  event TokenRedeemed(address indexed tokenAddress, uint256 amount);

  constructor(address _manager) AccessManaged(_manager) {}

  function redeemToken(
    address _tokenAddress,
    address _from,
    uint256 _amount
  ) public {
    IERC20(_tokenAddress).transferFrom(_from, address(this), _amount);
    emit TokenRedeemed(_tokenAddress, _amount);
  }
}
