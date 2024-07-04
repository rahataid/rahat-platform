import {
  OperationCanceled as OperationCanceledEvent,
  OperationExecuted as OperationExecutedEvent,
  OperationScheduled as OperationScheduledEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGrantDelayChanged as RoleGrantDelayChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleGuardianChanged as RoleGuardianChangedEvent,
  RoleLabel as RoleLabelEvent,
  RoleRevoked as RoleRevokedEvent,
  TargetAdminDelayUpdated as TargetAdminDelayUpdatedEvent,
  TargetClosed as TargetClosedEvent,
  TargetFunctionRoleUpdated as TargetFunctionRoleUpdatedEvent
} from "../generated/Rahat Access Manager/Rahat Access Manager"
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
} from "../generated/schema"

export function handleOperationCanceled(event: OperationCanceledEvent): void {
  let entity = new OperationCanceled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.operationId = event.params.operationId
  entity.nonce = event.params.nonce

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOperationExecuted(event: OperationExecutedEvent): void {
  let entity = new OperationExecuted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.operationId = event.params.operationId
  entity.nonce = event.params.nonce

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOperationScheduled(event: OperationScheduledEvent): void {
  let entity = new OperationScheduled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.operationId = event.params.operationId
  entity.nonce = event.params.nonce
  entity.schedule = event.params.schedule
  entity.caller = event.params.caller
  entity.target = event.params.target
  entity.data = event.params.data

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleAdminChanged(event: RoleAdminChangedEvent): void {
  let entity = new RoleAdminChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.roleId = event.params.roleId
  entity.admin = event.params.admin

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleGrantDelayChanged(
  event: RoleGrantDelayChangedEvent
): void {
  let entity = new RoleGrantDelayChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.roleId = event.params.roleId
  entity.delay = event.params.delay
  entity.since = event.params.since

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let entity = new RoleGranted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.roleId = event.params.roleId
  entity.account = event.params.account
  entity.delay = event.params.delay
  entity.since = event.params.since
  entity.newMember = event.params.newMember

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleGuardianChanged(
  event: RoleGuardianChangedEvent
): void {
  let entity = new RoleGuardianChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.roleId = event.params.roleId
  entity.guardian = event.params.guardian

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleLabel(event: RoleLabelEvent): void {
  let entity = new RoleLabel(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.roleId = event.params.roleId
  entity.label = event.params.label

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  let entity = new RoleRevoked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.roleId = event.params.roleId
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTargetAdminDelayUpdated(
  event: TargetAdminDelayUpdatedEvent
): void {
  let entity = new TargetAdminDelayUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.target = event.params.target
  entity.delay = event.params.delay
  entity.since = event.params.since

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTargetClosed(event: TargetClosedEvent): void {
  let entity = new TargetClosed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.target = event.params.target
  entity.closed = event.params.closed

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTargetFunctionRoleUpdated(
  event: TargetFunctionRoleUpdatedEvent
): void {
  let entity = new TargetFunctionRoleUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.target = event.params.target
  entity.selector = event.params.selector
  entity.roleId = event.params.roleId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
