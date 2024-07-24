import { newMockEvent } from "matchstick-as"
import { ethereum, Bytes, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  OperationCanceled,
  OperationExecuted,
  OperationScheduled,
  RoleAdminChanged,
  RoleGrantDelayChanged,
  RoleGranted,
  RoleGuardianChanged,
  RoleLabel,
  RoleRevoked,
  TargetAdminDelayUpdated,
  TargetClosed,
  TargetFunctionRoleUpdated
} from "../generated/Rahat Access Manager/Rahat Access Manager"

export function createOperationCanceledEvent(
  operationId: Bytes,
  nonce: BigInt
): OperationCanceled {
  let operationCanceledEvent = changetype<OperationCanceled>(newMockEvent())

  operationCanceledEvent.parameters = new Array()

  operationCanceledEvent.parameters.push(
    new ethereum.EventParam(
      "operationId",
      ethereum.Value.fromFixedBytes(operationId)
    )
  )
  operationCanceledEvent.parameters.push(
    new ethereum.EventParam("nonce", ethereum.Value.fromUnsignedBigInt(nonce))
  )

  return operationCanceledEvent
}

export function createOperationExecutedEvent(
  operationId: Bytes,
  nonce: BigInt
): OperationExecuted {
  let operationExecutedEvent = changetype<OperationExecuted>(newMockEvent())

  operationExecutedEvent.parameters = new Array()

  operationExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "operationId",
      ethereum.Value.fromFixedBytes(operationId)
    )
  )
  operationExecutedEvent.parameters.push(
    new ethereum.EventParam("nonce", ethereum.Value.fromUnsignedBigInt(nonce))
  )

  return operationExecutedEvent
}

export function createOperationScheduledEvent(
  operationId: Bytes,
  nonce: BigInt,
  schedule: BigInt,
  caller: Address,
  target: Address,
  data: Bytes
): OperationScheduled {
  let operationScheduledEvent = changetype<OperationScheduled>(newMockEvent())

  operationScheduledEvent.parameters = new Array()

  operationScheduledEvent.parameters.push(
    new ethereum.EventParam(
      "operationId",
      ethereum.Value.fromFixedBytes(operationId)
    )
  )
  operationScheduledEvent.parameters.push(
    new ethereum.EventParam("nonce", ethereum.Value.fromUnsignedBigInt(nonce))
  )
  operationScheduledEvent.parameters.push(
    new ethereum.EventParam(
      "schedule",
      ethereum.Value.fromUnsignedBigInt(schedule)
    )
  )
  operationScheduledEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  operationScheduledEvent.parameters.push(
    new ethereum.EventParam("target", ethereum.Value.fromAddress(target))
  )
  operationScheduledEvent.parameters.push(
    new ethereum.EventParam("data", ethereum.Value.fromBytes(data))
  )

  return operationScheduledEvent
}

export function createRoleAdminChangedEvent(
  roleId: BigInt,
  admin: BigInt
): RoleAdminChanged {
  let roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent())

  roleAdminChangedEvent.parameters = new Array()

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("roleId", ethereum.Value.fromUnsignedBigInt(roleId))
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("admin", ethereum.Value.fromUnsignedBigInt(admin))
  )

  return roleAdminChangedEvent
}

export function createRoleGrantDelayChangedEvent(
  roleId: BigInt,
  delay: BigInt,
  since: BigInt
): RoleGrantDelayChanged {
  let roleGrantDelayChangedEvent = changetype<RoleGrantDelayChanged>(
    newMockEvent()
  )

  roleGrantDelayChangedEvent.parameters = new Array()

  roleGrantDelayChangedEvent.parameters.push(
    new ethereum.EventParam("roleId", ethereum.Value.fromUnsignedBigInt(roleId))
  )
  roleGrantDelayChangedEvent.parameters.push(
    new ethereum.EventParam("delay", ethereum.Value.fromUnsignedBigInt(delay))
  )
  roleGrantDelayChangedEvent.parameters.push(
    new ethereum.EventParam("since", ethereum.Value.fromUnsignedBigInt(since))
  )

  return roleGrantDelayChangedEvent
}

export function createRoleGrantedEvent(
  roleId: BigInt,
  account: Address,
  delay: BigInt,
  since: BigInt,
  newMember: boolean
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent())

  roleGrantedEvent.parameters = new Array()

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("roleId", ethereum.Value.fromUnsignedBigInt(roleId))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("delay", ethereum.Value.fromUnsignedBigInt(delay))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("since", ethereum.Value.fromUnsignedBigInt(since))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("newMember", ethereum.Value.fromBoolean(newMember))
  )

  return roleGrantedEvent
}

export function createRoleGuardianChangedEvent(
  roleId: BigInt,
  guardian: BigInt
): RoleGuardianChanged {
  let roleGuardianChangedEvent = changetype<RoleGuardianChanged>(newMockEvent())

  roleGuardianChangedEvent.parameters = new Array()

  roleGuardianChangedEvent.parameters.push(
    new ethereum.EventParam("roleId", ethereum.Value.fromUnsignedBigInt(roleId))
  )
  roleGuardianChangedEvent.parameters.push(
    new ethereum.EventParam(
      "guardian",
      ethereum.Value.fromUnsignedBigInt(guardian)
    )
  )

  return roleGuardianChangedEvent
}

export function createRoleLabelEvent(roleId: BigInt, label: string): RoleLabel {
  let roleLabelEvent = changetype<RoleLabel>(newMockEvent())

  roleLabelEvent.parameters = new Array()

  roleLabelEvent.parameters.push(
    new ethereum.EventParam("roleId", ethereum.Value.fromUnsignedBigInt(roleId))
  )
  roleLabelEvent.parameters.push(
    new ethereum.EventParam("label", ethereum.Value.fromString(label))
  )

  return roleLabelEvent
}

export function createRoleRevokedEvent(
  roleId: BigInt,
  account: Address
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent())

  roleRevokedEvent.parameters = new Array()

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("roleId", ethereum.Value.fromUnsignedBigInt(roleId))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return roleRevokedEvent
}

export function createTargetAdminDelayUpdatedEvent(
  target: Address,
  delay: BigInt,
  since: BigInt
): TargetAdminDelayUpdated {
  let targetAdminDelayUpdatedEvent = changetype<TargetAdminDelayUpdated>(
    newMockEvent()
  )

  targetAdminDelayUpdatedEvent.parameters = new Array()

  targetAdminDelayUpdatedEvent.parameters.push(
    new ethereum.EventParam("target", ethereum.Value.fromAddress(target))
  )
  targetAdminDelayUpdatedEvent.parameters.push(
    new ethereum.EventParam("delay", ethereum.Value.fromUnsignedBigInt(delay))
  )
  targetAdminDelayUpdatedEvent.parameters.push(
    new ethereum.EventParam("since", ethereum.Value.fromUnsignedBigInt(since))
  )

  return targetAdminDelayUpdatedEvent
}

export function createTargetClosedEvent(
  target: Address,
  closed: boolean
): TargetClosed {
  let targetClosedEvent = changetype<TargetClosed>(newMockEvent())

  targetClosedEvent.parameters = new Array()

  targetClosedEvent.parameters.push(
    new ethereum.EventParam("target", ethereum.Value.fromAddress(target))
  )
  targetClosedEvent.parameters.push(
    new ethereum.EventParam("closed", ethereum.Value.fromBoolean(closed))
  )

  return targetClosedEvent
}

export function createTargetFunctionRoleUpdatedEvent(
  target: Address,
  selector: Bytes,
  roleId: BigInt
): TargetFunctionRoleUpdated {
  let targetFunctionRoleUpdatedEvent = changetype<TargetFunctionRoleUpdated>(
    newMockEvent()
  )

  targetFunctionRoleUpdatedEvent.parameters = new Array()

  targetFunctionRoleUpdatedEvent.parameters.push(
    new ethereum.EventParam("target", ethereum.Value.fromAddress(target))
  )
  targetFunctionRoleUpdatedEvent.parameters.push(
    new ethereum.EventParam("selector", ethereum.Value.fromFixedBytes(selector))
  )
  targetFunctionRoleUpdatedEvent.parameters.push(
    new ethereum.EventParam("roleId", ethereum.Value.fromUnsignedBigInt(roleId))
  )

  return targetFunctionRoleUpdatedEvent
}
