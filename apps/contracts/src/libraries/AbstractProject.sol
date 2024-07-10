// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/metatx/ERC2771Context.sol';
import '@openzeppelin/contracts/metatx/ERC2771Forwarder.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/Multicall.sol';
import '../interfaces/IRahatProject.sol';

abstract contract AbstractProject is IRahatProject, ERC2771Context, Multicall {
  using EnumerableSet for EnumerableSet.AddressSet;

  // #region ***** Events *********//
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
  event BeneficiaryAdded(address indexed);
  event BeneficiaryRemoved(address indexed);

  // #endregion

  // #region ***** Variables *********//
  mapping(address => mapping(address => uint)) public tokenAllocations; //tokenaddress => ben => amount
  uint256 public totalAllocated;

  string public override name;

  EnumerableSet.AddressSet internal _beneficiaries;

  // #endregion

  constructor(
    string memory _name,
    address _forwarder
  ) ERC2771Context(_forwarder) {
    name = _name;
  }

  // #region ***** Beneficiary Functions *********//
  function isBeneficiary(address _address) public view virtual returns (bool) {
    return _beneficiaries.contains(_address);
  }

  function beneficiaryCount() public view virtual returns (uint256) {
    return _beneficiaries.length();
  }

  function _addBeneficiary(address _address) internal {
    if (!_beneficiaries.contains(_address)) emit BeneficiaryAdded(_address);
    _beneficiaries.add(_address);
    emit BeneficiaryAdded(_address);
  }

  function _removeBeneficiary(address _address) internal {
    if (_beneficiaries.contains(_address)) emit BeneficiaryRemoved(_address);
    _beneficiaries.remove(_address);
  }

  // #endregion

  function allocateToken(
    address _token,
    address _beneficiary,
    uint256 _amount
  ) external {
    require(_beneficiary != address(0), 'Beneficiary cannot be 0 address');
    _addBeneficiary(_beneficiary);
    //reduce from total allocations
    totalAllocated -= tokenAllocations[_token][_beneficiary];
    //update token allocation
    tokenAllocations[_token][_beneficiary] = _amount;
    //add to total allocations
    totalAllocated += _amount;
    emit TokensAllocated(_token, _beneficiary, _amount);
  }

  //todo: disburse with conditions to beneficiaries
  function disburseToken(address _token, address _beneficiary) external {
    uint256 _amount = tokenAllocations[_token][_beneficiary];
    require(_amount > 0, 'No tokens to disburse');
    tokenAllocations[_token][_beneficiary] = 0;
    IERC20(_token).transfer(_beneficiary, _amount);
    emit TokensDisbursed(_token, _beneficiary, _amount);
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
