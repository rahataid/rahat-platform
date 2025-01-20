// SPDX-License-Identifier: LGPL-3.0
pragma solidity 0.8.20;

import '@openzeppelin/contracts/access/manager/AccessManager.sol';

contract RahatAccessManager is AccessManager {
  constructor(address _manager) AccessManager(_manager) {}
}
