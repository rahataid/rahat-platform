// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './AbstractOwner.sol';

/**
 * @title AbstractTokenActions
 * @dev This abstract contract provides functions for token management actions such as transferring,
 * approving, claiming, and querying token allowances and balances. It inherits from AbstractOwner
 * to enforce ownership restrictions on these actions.
 */
abstract contract AbstractTokenActions is AbstractOwner {
  /**
   * @dev Transfers tokens from the contract to a specified address.
   * @param _token The address of the token to transfer.
   * @param _to The address to which the tokens will be sent.
   * @param _amount The amount of tokens to transfer.
   * Requirements:
   * - The caller must be the owner.
   */
  function transferToken(
    address _token,
    address _to,
    uint256 _amount
  ) public virtual OnlyOwner {
    IERC20(_token).transfer(_to, _amount);
  }

  /**
   * @dev Approves a spender to spend a specified amount of tokens on behalf of the contract.
   * @param _token The address of the token to approve.
   * @param _spender The address that will be allowed to spend the tokens.
   * @param _amount The amount of tokens to approve for spending.
   * Requirements:
   * - The caller must be the owner.
   */
  function approveToken(
    address _token,
    address _spender,
    uint256 _amount
  ) public virtual OnlyOwner {
    IERC20(_token).approve(_spender, _amount);
  }

  /**
   * @dev Claims tokens from a specified address to the contract.
   * @param _token The address of the token to claim.
   * @param _from The address from which the tokens will be claimed.
   * @param _amount The amount of tokens to claim.
   * Requirements:
   * - The caller must be the owner.
   */
  function claimToken(
    address _token,
    address _from,
    uint256 _amount
  ) public virtual OnlyOwner {
    IERC20(_token).transferFrom(_from, address(this), _amount);
  }

  /**
   * @dev Transfers tokens from one address to another.
   * @param _token The address of the token to transfer.
   * @param _from The address from which the tokens will be transferred.
   * @param _to The address to which the tokens will be sent.
   * @param _amount The amount of tokens to transfer.
   * Requirements:
   * - The caller must be the owner.
   */
  function transferFromToken(
    address _token,
    address _from,
    address _to,
    uint256 _amount
  ) public virtual OnlyOwner {
    IERC20(_token).transferFrom(_from, _to, _amount);
  }

  /**
   * @dev Gets the allowance and balance of the contract for a specific token.
   * @param _token The address of the token to query.
   * @param _from The address for which the allowance is being checked.
   * @return allowance The amount of tokens that the contract is allowed to spend on behalf of `_from`.
   * @return balance The balance of the contract for the specified token.
   */
  function getAllowanceAndBalance(
    address _token,
    address _from
  ) public view virtual returns (uint allowance, uint balance) {
    allowance = IERC20(_token).allowance(_from, address(this));
    balance = IERC20(_token).balanceOf(address(this));
  }
}
