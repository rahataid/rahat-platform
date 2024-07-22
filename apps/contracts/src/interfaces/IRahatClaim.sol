//SPDX-License-Identifier: LGPL-3.0
pragma solidity ^0.8.17;

interface IRahatClaim {
  struct Claim {
    address ownerAddress;
    address claimerAddress;
    address claimeeAddress;
    address otpServerAddress;
    address tokenAddress;
    uint amount;
    uint expiryDate;
    bytes32 otpHash;
    bool isProcessed;
  }

  function createClaim(
    address _claimerAddress,
    address _claimeeAddress,
    address _otpServerAddress,
    address _tokenAddress,
    uint _amount
  ) external returns (uint claimId);

  function addOtpToClaim(uint _claimId, bytes32 _otpHash, uint256 _expiryDate) external;

  function processClaim(uint _claimId, string memory _otp) external returns (Claim memory claim_);
}
