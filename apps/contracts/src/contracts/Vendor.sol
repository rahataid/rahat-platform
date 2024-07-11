//SPDX-License-Identifier: LGPL-3.0
pragma solidity 0.8.20;

import '@openzeppelin/contracts/metatx/ERC2771Context.sol';
import '../interfaces/IRahatProject.sol';
import '../interfaces/IRahatClaim.sol';

contract Vendor is ERC2771Context {
  address public otpServerAddress;

  IRahatClaim public RahatClaim;
  IRahatProject public RahatProject;

  mapping(address => mapping(address => uint)) public tokenRequestIds; //vendorAddress=>benAddress=>requestId;

  constructor(
    address _rahatProject,
    address _rahatClaim,
    address _forwarder,
    address _otpServerAddress
  ) ERC2771Context(_forwarder) {
    RahatProject = IRahatProject(_rahatProject);
    RahatClaim = IRahatClaim(_rahatClaim);
    otpServerAddress = _otpServerAddress;
  }

  function requestTokenFromBeneficiary(
    address _tokenAddress,
    address _benAddress,
    uint _amount
  ) public returns (uint requestId) {
    require(otpServerAddress != address(0), 'invalid otp-server');
    require(
      RahatProject.tokenAllocations(_tokenAddress, _benAddress) >= _amount,
      'not enough balance'
    );

    requestId = RahatClaim.createClaim(
      _msgSender(),
      _benAddress,
      otpServerAddress,
      _tokenAddress,
      _amount
    );
    tokenRequestIds[_msgSender()][_benAddress] = requestId;
  }

  function processTokenRequest(address _benAddress, string memory _otp) public {
    IRahatClaim.Claim memory _claim = RahatClaim.processClaim(
      tokenRequestIds[_msgSender()][_benAddress],
      _otp
    );
    RahatProject.transferTokenToClaimer(
      _claim.tokenAddress,
      _claim.claimeeAddress,
      _claim.claimerAddress,
      _claim.amount
    );
  }
}
