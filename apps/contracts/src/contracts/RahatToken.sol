//SPDX-License-Identifier: LGPL-3.0
pragma solidity 0.8.20;

//ERC20 Tokens
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';
import '../interfaces/IRahatToken.sol';
import '../libraries/AbstractOwner.sol';
import '@openzeppelin/contracts/access/manager/AccessManaged.sol';

contract RahatToken is
    AbstractOwner,
    ERC20,
    ERC20Burnable,
    IRahatToken,
    AccessManaged
{
    uint8 private decimalPoints;
    string public description;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _description,
        uint8 _decimals,
        uint256 _initialSupply,
        address _to,
        address _manager
    ) ERC20(_name, _symbol) AccessManaged(_manager) {
        decimalPoints = _decimals;
        description = _description;
        _mint(_to, _initialSupply);
    }

    ///@dev returns the decimals of the tokens
    function decimals() public view override returns (uint8) {
        return decimalPoints;
    }

    ///@dev Mint x amount of ERC20 token to given address
    ///@param _address Address to which ERC20 token will be minted
    ///@param _amount Amount of token to be minted
    function mint(address _address, uint256 _amount) public returns (uint256) {
        _mint(_address, _amount);
        return _amount;
    }
}
