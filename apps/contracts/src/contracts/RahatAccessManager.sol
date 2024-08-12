// SPDX-License-Identifier: LGPL-3.0
pragma solidity 0.8.20;

import '@openzeppelin/contracts/access/manager/AccessManager.sol';

contract RahatAccessManager is AccessManager {
  //ADMIN_ROLE = 0
  //PUBLIC_ROLE = max(uint64)
  //MINTER_ROLE = 1
  //MANAGER_ROLE = 2
  //

  constructor(address _manager) AccessManager(_manager) {}
}
