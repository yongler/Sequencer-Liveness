const truffleAssert = require("truffle-assertions");

const Layer2User = artifacts.require("Layer2User");
const Layer1Bridge = artifacts.require("Layer1Bridge");
const Layer2Sequencer = artifacts.require("Layer2Sequencer");

contract("Layer2Sequencer", (accounts) => {
  let user1;
  let user2;
  let bridge;
  let sequencer;

  before(async () => {
    user1 = await Layer2User.new(20); // Initialize with an initial supply of 20 tokens
    user2 = await Layer2User.new(20); // Initialize with an initial supply of 20 tokens
    bridge = await Layer1Bridge.new();
    sequencer = await Layer2Sequencer.new(bridge.address);
  });

  it("Layer 2 sequencer should emit the batchPublished event after 5 transactions", async () => {
    for (let i = 0; i < 5; i++) {
      await sequencer.addTransaction(user1.address, user2.address, i + 1);
    }

    var trxs = await sequencer.getTransactions();
    assert.equal(trxs.length, 5, "Transactions were not removed properly");

    // Publish batch and check that bridge has received it
    await sequencer.publishBatch();

    var receivedEvents = await bridge.getPastEvents("BatchReceived", {
      fromBlock: "latest",
    });
    assert.equal(receivedEvents.length, 1, "BatchReceived event not emitted");
  });

  it("Layer 2 sequencer should not publish batch if shutdown", async () => {
    // Shutdown the sequencer
    await sequencer.shutDown();

    var trxs = await sequencer.getTransactions();
    assert.equal(
      trxs.length,
      0,
      "Transactions were published when sequencer was shutdown"
    );

    // Send 5 trx and check that sequencer got it
    for (let i = 0; i < 5; i++) {
      await sequencer.addTransaction(user1.address, user2.address, i + 1);
    }
    var trxs = await sequencer.getTransactions();
    assert.equal(
      trxs.length,
      5,
      "Transactions were published when sequencer was shutdown"
    );

    // Try to publish batch when sequencer is shutdown
    truffleAssert.reverts(
      sequencer.publishBatch(),
      "Sequencer must be Live",
      "Should revert when sequencer that is shutdown tries to publishBatch"
    );

    // Check that transactions are still in sequencer and not published
    var trxs = await sequencer.getTransactions();
    assert.equal(
      trxs.length,
      5,
      "Transactions were published when sequencer was shutdown"
    );
  });

  it("Layer 2 sequencer should publish batch if started back to live", async () => {
    await sequencer.start();

    // Check that transactions are still in sequencer and not published
    var trxs = await sequencer.getTransactions();
    assert.equal(trxs.length, 5, "Transactions is not persistent");

    // Publish batch and check that bridge has received it
    await sequencer.publishBatch();

    var trxs = await sequencer.getTransactions();
    assert.equal(
      trxs.length,
      0,
      "Transactions were not removed properly when sequencer is restarted"
    );

    var receivedEvents = await bridge.getPastEvents("BatchReceived", {
      fromBlock: "latest",
    });
    assert.equal(
      receivedEvents.length,
      1,
      "BatchReceived event not emitted when sequencer is restarted"
    );
  });
});
