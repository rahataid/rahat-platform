import { DataSourceTemplate } from '@graphprotocol/graph-ts';
import {
  AuthorityUpdated as AuthorityUpdatedEvent,
  TokenCreated as TokenCreatedEvent,
  TokenMintedAndApproved as TokenMintedAndApprovedEvent,
  TokenMintedAndSent as TokenMintedAndSentEvent,
} from '../generated/RahatTreasury/RahatTreasury';
import {
  AuthorityUpdated,
  TokenCreated,
  TokenMintedAndApproved,
  TokenMintedAndSent,
} from '../generated/schema';
export function handleAuthorityUpdated(event: AuthorityUpdatedEvent): void {
  let entity = new AuthorityUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.authority = event.params.authority;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleTokenCreated(event: TokenCreatedEvent): void {
  let entity = new TokenCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.tokenAddress = event.params.tokenAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
  DataSourceTemplate.create("RahatToken", [event.params.tokenAddress.toHex()])
  // RahatToken.create(event.params.tokenAddress)
  // fetchTokenDetail(event.params.tokenAddress);
}

export function handleTokenMintedAndApproved(
  event: TokenMintedAndApprovedEvent
): void {
  let entity = new TokenMintedAndApproved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.tokenAddress = event.params.tokenAddress;
  entity.approveAddress = event.params.approveAddress;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
  // fetchTokenDetail(event.params.tokenAddress);
}

export function handleTokenMintedAndSent(event: TokenMintedAndSentEvent): void {
  let entity = new TokenMintedAndSent(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.tokenAddress = event.params.tokenAddress;
  entity.receiverAddress = event.params.receiverAddress;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
