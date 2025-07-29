// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Disbursement {
    bytes32 public merkleRoot; // Current Merkle root
    mapping(address => bool) public hasClaimed; // Tracks claims

    event RootUpdated(bytes32 newRoot);
    event Claimed(address indexed beneficiary, uint256 amount);

    // Set the initial Merkle root
    function setMerkleRoot(bytes32 newRoot) external {
        merkleRoot = newRoot;
        emit RootUpdated(newRoot);
    }

    // Verify Merkle Proof
    function verifyProof(
        bytes32[] memory proof,
        bytes32 leaf
    ) public view returns (bool) {
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash < proofElement) {
                // Hash order is maintained
                computedHash = keccak256(
                    abi.encodePacked(computedHash, proofElement)
                );
            } else {
                computedHash = keccak256(
                    abi.encodePacked(proofElement, computedHash)
                );
            }
        }
        return computedHash == merkleRoot;
    }

    // Claim tokens using the Merkle proof
    function claim(
        address beneficiary,
        uint256 amount,
        bytes32[] memory proof
    ) external {
        require(!hasClaimed[beneficiary], 'Tokens already claimed');
        bytes32 leaf = keccak256(abi.encodePacked(beneficiary, amount));
        require(verifyProof(proof, leaf), 'Invalid Merkle proof');

        hasClaimed[beneficiary] = true;
        // Implement token transfer logic here (ERC20 or Ether)
        // For example: token.transfer(beneficiary, amount);

        emit Claimed(beneficiary, amount);
    }
}
