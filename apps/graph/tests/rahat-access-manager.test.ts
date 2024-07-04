import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Bytes, BigInt, Address } from "@graphprotocol/graph-ts"
import { OperationCanceled } from "../generated/schema"
import { OperationCanceled as OperationCanceledEvent } from "../generated/Rahat Access Manager/Rahat Access Manager"
import { handleOperationCanceled } from "../src/rahat-access-manager"
import { createOperationCanceledEvent } from "./rahat-access-manager-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let operationId = Bytes.fromI32(1234567890)
    let nonce = BigInt.fromI32(234)
    let newOperationCanceledEvent = createOperationCanceledEvent(
      operationId,
      nonce
    )
    handleOperationCanceled(newOperationCanceledEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("OperationCanceled created and stored", () => {
    assert.entityCount("OperationCanceled", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "OperationCanceled",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "operationId",
      "1234567890"
    )
    assert.fieldEquals(
      "OperationCanceled",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "nonce",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
