// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { AAJobs, MS_ACTIONS } from '@rahataid/sdk';
import { ProjectActionFunc } from '@rahataid/sdk/project/project.types';

export const aaActions: ProjectActionFunc = {
  /***********************
   * Development Only
   *************************/
  [MS_ACTIONS.AAPROJECT.TRIGGERS.DEV_ONLY]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.TRIGGERS.DEV_ONLY, uuid }, payload),
  /************************/

  // **** triggers start ******//
  [MS_ACTIONS.AAPROJECT.TRIGGERS.ADD]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.TRIGGERS.ADD, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.TRIGGERS.REMOVE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.TRIGGERS.REMOVE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.TRIGGERS.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.TRIGGERS.GET_ALL, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.TRIGGERS.GET_ONE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.TRIGGERS.GET_ONE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.TRIGGERS.ACTIVATE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.TRIGGERS.ACTIVATE, uuid }, payload),
  [MS_ACTIONS.AAPROJECT.TRIGGERS.TEST]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.TRIGGERS.TEST, uuid }, payload),
  // **** triggers end ******//

  // **** river stations start ******//
  [MS_ACTIONS.AAPROJECT.RIVER_STATIONS.GET_DHM]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.RIVER_STATIONS.GET_DHM, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.WATER_LEVELS.GET_DHM]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.WATER_LEVELS.GET_DHM, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.WATER_LEVELS.GET_GLOFAS]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.WATER_LEVELS.GET_GLOFAS, uuid }, payload),
  // **** river stations end ******//

  // **** activities start ******//
  [MS_ACTIONS.AAPROJECT.ACTIVITIES.COMMUNICATION.SESSION_LOGS]: (
    uuid,
    payload,
    sendCommand
  ) =>
    sendCommand(
      { cmd: AAJobs.ACTIVITIES.COMMUNICATION.SESSION_LOGS, uuid },
      payload
    ),

  [MS_ACTIONS.AAPROJECT.ACTIVITIES.COMMUNICATION.RETRY_FAILED]: (
    uuid,
    payload,
    sendCommand
  ) =>
    sendCommand(
      { cmd: AAJobs.ACTIVITIES.COMMUNICATION.RETRY_FAILED, uuid },
      payload
    ),

  [MS_ACTIONS.AAPROJECT.ACTIVITIES.COMMUNICATION.TRIGGER]: (
    uuid,
    payload,
    sendCommand
  ) =>
    sendCommand(
      { cmd: AAJobs.ACTIVITIES.COMMUNICATION.TRIGGER, uuid },
      payload
    ),

  [MS_ACTIONS.AAPROJECT.ACTIVITIES.ADD]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.ACTIVITIES.ADD, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.ACTIVITIES.REMOVE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.ACTIVITIES.REMOVE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.ACTIVITIES.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.ACTIVITIES.GET_ALL, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.ACTIVITIES.GET_HAVING_COMMS]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.ACTIVITIES.GET_HAVING_COMMS, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.ACTIVITIES.GET_ONE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.ACTIVITIES.GET_ONE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.ACTIVITIES.UPDATE_STATUS]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.ACTIVITIES.UPDATE_STATUS, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.ACTIVITIES.UPDATE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.ACTIVITIES.UPDATE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.ACTIVITIES.COMMUNICATION.GET_STATS]: (
    uuid,
    payload,
    sendCommand
  ) =>
    sendCommand(
      { cmd: AAJobs.ACTIVITIES.COMMUNICATION.GET_STATS, uuid },
      payload
    ),
  // **** activities end ******//

  // **** activity categories start ******//
  [MS_ACTIONS.AAPROJECT.ACTIVITY_CATEGORIES.GET_ALL]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.ACTIVITY_CATEGORIES.GET_ALL, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.ACTIVITY_CATEGORIES.ADD]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.ACTIVITY_CATEGORIES.ADD, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.ACTIVITY_CATEGORIES.REMOVE]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.ACTIVITY_CATEGORIES.REMOVE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.HAZARD_TYPES.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.HAZARD_TYPES.GET_ALL, uuid }, payload),
  // **** activity categories end ******//

  // **** phases start ******//
  [MS_ACTIONS.AAPROJECT.PHASES.GET_ONE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.PHASES.GET_ONE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.PHASES.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.PHASES.GET_ALL, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.PHASES.GET_STATS]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.PHASES.GET_STATS, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.PHASES.ADD_TRIGGERS]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.PHASES.ADD_TRIGGERS, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.PHASES.REVERT_PHASE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.PHASES.REVERT_PHASE, uuid }, payload),
  // **** phases end ******//

  // **** stakeholders ******//
  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.ADD]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STAKEHOLDERS.ADD, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.BULK_ADD]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STAKEHOLDERS.BULK_ADD, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.REMOVE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STAKEHOLDERS.REMOVE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.UPDATE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STAKEHOLDERS.UPDATE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STAKEHOLDERS.GET_ALL, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.GET_ONE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STAKEHOLDERS.GET_ONE, uuid }, payload),

  // **** stakeholders end ******//

  // **** Stakeholders groups ******//
  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.GET_ALL_GROUPS]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STAKEHOLDERS.GET_ALL_GROUPS, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.GET_ONE_GROUP]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STAKEHOLDERS.GET_ONE_GROUP, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.ADD_GROUP]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STAKEHOLDERS.ADD_GROUP, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.UPDATE_GROUP]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STAKEHOLDERS.UPDATE_GROUP, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.DELETE_GROUP]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STAKEHOLDERS.DELETE_GROUP, uuid }, payload),
  // **** Stakeholders groups end ******//

  // **** Contract Interactions ****//
  [MS_ACTIONS.AAPROJECT.CONTRACT.INCREASE_BUDEGET]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.HAZARD_TYPES.GET_ALL, uuid }, payload),
  // **** Contract Interactions  end ****//

  // **** Beneficiary Groups **** //
  [MS_ACTIONS.AAPROJECT.BENEFICIARY.ADD_GROUP]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.BENEFICIARY.ADD_GROUP, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.BENEFICIARY.GET_ALL_GROUPS]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.BENEFICIARY.GET_ALL_GROUPS, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.BENEFICIARY.GET_ONE_GROUP]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.BENEFICIARY.GET_ONE_GROUP, uuid }, payload),
  // **** Beneficiary Groups end **** //

  // **** fund mgmt ****//
  [MS_ACTIONS.AAPROJECT.BENEFICIARY.RESERVE_TOKEN_TO_GROUP]: (
    uuid,
    payload,
    sendCommand
  ) =>
    sendCommand(
      { cmd: AAJobs.BENEFICIARY.RESERVE_TOKEN_TO_GROUP, uuid },
      payload
    ),

  [MS_ACTIONS.AAPROJECT.BENEFICIARY.GET_ALL_TOKEN_RESERVATION]: (
    uuid,
    payload,
    sendCommand
  ) =>
    sendCommand(
      { cmd: AAJobs.BENEFICIARY.GET_ALL_TOKEN_RESERVATION, uuid },
      payload
    ),

  [MS_ACTIONS.AAPROJECT.BENEFICIARY.GET_ONE_TOKEN_RESERVATION]: (
    uuid,
    payload,
    sendCommand
  ) =>
    sendCommand(
      { cmd: AAJobs.BENEFICIARY.GET_ONE_TOKEN_RESERVATION, uuid },
      payload
    ),

  [MS_ACTIONS.AAPROJECT.BENEFICIARY.GET_RESERVATION_STATS]: (
    uuid,
    payload,
    sendCommand
  ) =>
    sendCommand(
      { cmd: AAJobs.BENEFICIARY.GET_RESERVATION_STATS, uuid },
      payload
    ),

  // **** fund mgmt end ****//

  // **** stats ****//
  [MS_ACTIONS.AAPROJECT.STATS.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STATS.GET_ALL, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STATS.GET_ONE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STATS.GET_ONE, uuid }, payload),
  // **** stats end ****//

  // **** daily monitoring start ****//
  [MS_ACTIONS.AAPROJECT.DAILY_MONITORING.ADD]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.DAILY_MONITORING.ADD, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.DAILY_MONITORING.GET_ALL]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.DAILY_MONITORING.GET_ALL, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.DAILY_MONITORING.GET_ONE]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.DAILY_MONITORING.GET_ONE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.DAILY_MONITORING.UPDATE]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.DAILY_MONITORING.UPDATE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.DAILY_MONITORING.REMOVE]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.DAILY_MONITORING.REMOVE, uuid }, payload),
  // **** daily monitoring end ****//

  // **** Stellar start **** //
  [MS_ACTIONS.AAPROJECT.STELLAR.DISBURSE]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STELLAR.DISBURSE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STELLAR.SEND_OTP]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STELLAR.SEND_OTP, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STELLAR.SEND_GROUP_OTP]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STELLAR.SEND_GROUP_OTP, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STELLAR.SEND_ASSET]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STELLAR.SEND_ASSET_TO_VENDOR, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STELLAR.SEND_ASSET_WITH_ADDRESS]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STELLAR.SEND_ASSET_WITH_ADDRESS, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STELLAR.TRANSFER_TO_OFFRAMP]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STELLAR.TRANSFER_TO_OFFRAMP, uuid }, payload),

  // [MS_ACTIONS.AAPROJECT.STELLAR.GET_WALLET_BY_PHONE]: (
  //   uuid,
  //   payload,
  //   sendCommand
  // ) => sendCommand({ cmd: WalletJobs.GET_WALLET_BY_PHONE }, payload),

  [MS_ACTIONS.AAPROJECT.STELLAR.ADD_ONCHAIN_TRIGGER]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STELLAR.ADD_ONCHAIN_TRIGGER, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STELLAR.CHECK_TRUSTLINE]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STELLAR.CHECK_TRUSTLINE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STELLAR.TRUSTLINE]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STELLAR.FAUCET, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STELLAR.UPDATE_ONCHAIN_TRIGGER]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STELLAR.UPDATE_ONCHAIN_TRIGGER, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STELLAR.GET_ONCHAIN_TRIGGER]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STELLAR.GET_ONCHAIN_TRIGGER, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STELLAR.GET_STELLAR_STATS]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STELLAR.GET_STELLAR_STATS, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STELLAR.GET_TRANSACTIONS]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STELLAR.GET_TRANSACTIONS, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STELLAR.GET_WALLET_BALANCE]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STELLAR.GET_WALLET_BALANCE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STELLAR.GET_VENDOR_STATS]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STELLAR.GET_VENDOR_STATS, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STELLAR.GET_REDEMPTION_REQUEST]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: AAJobs.STELLAR.GET_REDEMPTION_REQUEST, uuid }, payload),
  // **** Stellar end **** //

  // **** Payout start **** //
  [MS_ACTIONS.AAPROJECT.PAYOUT.CREATE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.PAYOUT.CREATE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.PAYOUT.LIST]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.PAYOUT.LIST, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.PAYOUT.GET]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.PAYOUT.GET, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.PAYOUT.UPDATE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.PAYOUT.UPDATE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.PAYOUT.ASSIGN_TOKEN]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.PAYOUT.ASSIGN_TOKEN, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.PAYOUT.GET_PAYMENT_PROVIDERS]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.PAYOUT.GET_PAYMENT_PROVIDERS, uuid }, payload),

  // **** Payout end **** //

  // **** grievance start **** //
  [MS_ACTIONS.AAPROJECT.GRIEVANCES.CREATE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.GRIEVANCES.CREATE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.GRIEVANCES.LIST]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.GRIEVANCES.LIST, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.GRIEVANCES.GET]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.GRIEVANCES.GET, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.GRIEVANCES.UPDATE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.GRIEVANCES.UPDATE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.GRIEVANCES.UPDATE_STATUS]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.GRIEVANCES.UPDATE_STATUS, uuid }, payload),
  // **** grievance end **** //
};
