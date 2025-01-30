// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/Multicall.sol';
import '@openzeppelin/contracts/metatx/ERC2771Context.sol';
import '@openzeppelin/contracts/metatx/ERC2771Forwarder.sol';
import '@openzeppelin/contracts/access/manager/AccessManaged.sol';
import '../interfaces/IRahatProject.sol';

/**
 * @title AbstractProject
 * @dev This abstract contract serves as a base for projects that manage beneficiaries and token budgets.
 * It implements the IRahatProject interface and extends the Multicall functionality.
 * The contract allows for adding/removing beneficiaries and managing budgets for registered tokens.
 */
abstract contract AbstractProject is
  IRahatProject,
  ERC2771Context,
  AccessManaged,
  Multicall
{
  using SafeERC20 for IERC20;
  using EnumerableSet for EnumerableSet.AddressSet;

  // #region ***** Events *********//
  //Beneficiaries
  event BeneficiaryAdded(address indexed);
  event BeneficiaryRemoved(address indexed);

  //allocations and disbursements
  event TokensAllocated(
    address indexed token,
    address indexed beneficiary,
    uint256 amount
  );
  event TokensDisbursed(
    address indexed token,
    address indexed beneficiary,
    uint256 amount
  );

  //token management
  event TokenRegistered(address indexed tokenAddress);
  event TokenBudgetIncrease(address indexed tokenAddress, uint amount);
  event TokenBudgetDecrease(address indexed tokenAddress, uint amount);
  event TokenReceived(address indexed token, address indexed from, uint amount);
  event TokenTransfer(address indexed token, address indexed to, uint amount);
  // #endregion

  // #region ***** Variables *********//
  mapping(address => uint) private _tokenBudget;
  mapping(address => bool) private _registeredTokens;

  mapping(address => mapping(address => uint)) public tokenAllocations; //tokenaddress => ben => amount

  string public override name;

  EnumerableSet.AddressSet internal _beneficiaries;

  // #endregion

  constructor(
    string memory _name,
    address _manager,
    address _forwarder
  ) ERC2771Context(_forwarder) AccessManaged(_manager) {
    name = _name;
  }

  // #endregion

  // #region ***** Beneficiary Functions *********//
  /**
   * @dev Checks if an address is a beneficiary.
   * @param _address The address to check.
   * @return True if the address is a beneficiary, false otherwise.
   */
  function isBeneficiary(address _address) public view virtual returns (bool) {
    return _beneficiaries.contains(_address);
  }

  /**
   * @dev Returns the number of beneficiaries.
   * @return The count of beneficiaries.
   */
  function beneficiaryCount() public view virtual returns (uint256) {
    return _beneficiaries.length();
  }

  /**
   * @dev Adds a beneficiary address.
   * @param _address The address to add as a beneficiary.
   */
  function _addBeneficiary(address _address) internal restricted {
    if (!_beneficiaries.contains(_address)) emit BeneficiaryAdded(_address);
    _beneficiaries.add(_address);
  }

  /**
   * @dev Removes a beneficiary address.
   * @param _address The address to remove from beneficiaries.
   */
  function _removeBeneficiary(address _address) internal restricted {
    if (_beneficiaries.contains(_address)) emit BeneficiaryRemoved(_address);
    _beneficiaries.remove(_address);
  }

  function allocateToken(
    address _token,
    address _beneficiary,
    uint256 _amount
  ) internal restricted {
    require(_beneficiary != address(0), 'Beneficiary cannot be 0 address');
    _addBeneficiary(_beneficiary);
    tokenAllocations[_token][_beneficiary] = _amount;
    emit TokensAllocated(_token, _beneficiary, _amount);
  }

  //todo: disburse with conditions to beneficiaries
  function disburseToken(
    address _token,
    address _beneficiary
  ) internal restricted {
    uint256 _amount = tokenAllocations[_token][_beneficiary];
    require(_amount > 0, 'No tokens to disburse');
    tokenAllocations[_token][_beneficiary] = 0;
    IERC20(_token).safeTransfer(_beneficiary, _amount);
    emit TokensDisbursed(_token, _beneficiary, _amount);
  }

  // #endregion

  // #region ***** Token Budget Functions *********//
  /**
   * @dev Returns the budget for a specific token address.
   * @param _tokenAddress The address of the token.
   * @return The budget allocated for the token.
   */
  function tokenBudget(
    address _tokenAddress
  ) public view virtual returns (uint) {
    return _tokenBudget[_tokenAddress];
  }

  /**
   * @dev Increases the budget for a specific token address.
   * @param _tokenAddress The address of the token.
   * @param _amount The amount to increase the budget by.
   */
  function _tokenBudgetIncrease(address _tokenAddress, uint _amount) internal {
    _tokenBudget[_tokenAddress] += _amount;
    emit TokenBudgetIncrease(_tokenAddress, _amount);

    if (!_registeredTokens[_tokenAddress]) {
      _registeredTokens[_tokenAddress] = true;
      emit TokenRegistered(_tokenAddress);
    }
  }

  /**
   * @dev Decreases the budget for a specific token address.
   * @param _tokenAddress The address of the token.
   * @param _amount The amount to decrease the budget by.
   */
  function _tokenBudgetDecrease(address _tokenAddress, uint _amount) internal {
    _tokenBudget[_tokenAddress] -= _amount;
    emit TokenBudgetDecrease(_tokenAddress, _amount);
  }

  /**
   * @dev Accepts tokens from a specified address and updates the budget.
   * @param _tokenAddress The address of the token being accepted.
   * @param _from The address from which the tokens are being transferred.
   * @param _amount The amount of tokens to accept.
   */
  function acceptToken(
    address _tokenAddress,
    address _from,
    uint256 _amount
  ) public restricted {
    IERC20(_tokenAddress).safeTransferFrom(_from, address(this), _amount);
    _tokenBudgetIncrease(_tokenAddress, _amount);
    emit TokenReceived(_tokenAddress, _from, _amount);
  }

  /**
   * @dev Withdraws tokens from the contract to a specified address.
   * @param _tokenAddress The address of the token to withdraw.
   * @param _amount The amount of tokens to withdraw.
   * @param _withdrawAddress The address to which the tokens will be sent.
   */
  function _withdrawToken(
    address _tokenAddress,
    uint _amount,
    address _withdrawAddress
  ) internal restricted {
    if (_tokenBudget[_tokenAddress] > _amount)
      _tokenBudgetDecrease(_tokenAddress, _amount);
    IERC20(_tokenAddress).safeTransfer(_withdrawAddress, _amount);
    emit TokenTransfer(_tokenAddress, address(_withdrawAddress), _amount);
  }

  function _msgSender()
    internal
    view
    override(Context, ERC2771Context)
    returns (address sender)
  {
    sender = ERC2771Context._msgSender();
  }

  /// @dev overriding the method to ERC2771Context
  function _msgData()
    internal
    view
    override(Context, ERC2771Context)
    returns (bytes calldata)
  {
    return ERC2771Context._msgData();
  }

  function _contextSuffixLength()
    internal
    view
    override(Context, ERC2771Context)
    returns (uint256)
  {
    return ERC2771Context._contextSuffixLength();
  }
}
