//SPDX-License-Identifier: LGPL-3.0
pragma solidity 0.8.20;
import '../interfaces/IRahatClaim.sol';
import '@openzeppelin/contracts/utils/Multicall.sol';

contract RahatClaim is IRahatClaim, Multicall {
  event ClaimCreated(
    uint256 indexed claimId,
    address indexed claimer,
    address indexed claimee,
    address token,
    address otpServer,
    uint256 amount
  );
  event OtpAddedToClaim(uint256 indexed claimId);
  event ClaimProcessed(uint256 indexed claimId);

  mapping(uint256 => Claim) public claims;
  uint256 public claimCount;

  function createClaim(
    address _claimerAddress,
    address _claimeeAddress,
    address _otpServerAddress,
    address _tokenAddress,
    uint256 _amount
  ) public returns (uint256 claimId) {
    claimId = ++claimCount;
    claims[claimId] = Claim({
      ownerAddress: msg.sender,
      claimerAddress: _claimerAddress,
      claimeeAddress: _claimeeAddress,
      otpServerAddress: _otpServerAddress,
      tokenAddress: _tokenAddress,
      amount: _amount,
      expiryDate: 0,
      otpHash: bytes32(0),
      isProcessed: false
    });
    emit ClaimCreated(
      claimId,
      _claimerAddress,
      _claimeeAddress,
      _tokenAddress,
      _otpServerAddress,
      _amount
    );
  }

  function addOtpToClaim(uint256 _claimId, bytes32 _otpHash, uint256 _expiryDate) public {
    Claim storage _claim = claims[_claimId];
    require(_claim.otpServerAddress == msg.sender, 'unauthorized otpServer');
    require(_claim.isProcessed == false, 'already processed');
    _claim.expiryDate = _expiryDate;
    _claim.otpHash = _otpHash;
    emit OtpAddedToClaim(_claimId);
  }

  function processClaim(uint256 _claimId, string memory _otp) public returns (Claim memory claim_) {
    Claim storage _claim = claims[_claimId];
    require(_claim.ownerAddress == msg.sender, 'not owner');
    require(block.timestamp <= _claim.expiryDate, 'expired');
    require(_claim.isProcessed == false, 'already processed');
    bytes32 _otpHash = findHash(_otp);
    require(_claim.otpHash == _otpHash, 'invalid otp');

    _claim.isProcessed = true;
    emit ClaimProcessed(_claimId);
    return _claim;
  }

  function findHash(string memory _data) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(_data));
  }
}
