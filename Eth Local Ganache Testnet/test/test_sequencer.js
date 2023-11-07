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
    user1 = await Layer2User.new(40); // Initialize with an initial supply of 20 tokens
    user2 = await Layer2User.new(40); // Initialize with an initial supply of 20 tokens
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

  it("Layer 2 sequencer TPS should decrease to 0 and increase back to usual when shutting down and restarting", async () => {
    // Keep sending transactions to normal sequencer
    var tps = [];
    var trxs = [];
    var totalTransactions = 0;

    var startTime, endTime;
    startTime = new Date();

    for (let i = 0; i < 200; i++) {
      // Simulate batch processing at intervals of sequencer, get transactions batched and tps
      if (i % 20 == 0) {
        await sequencer.publishBatch();
        var receivedEvents = await bridge.getPastEvents("TransactionReceived", {
          fromBlock: 0,
          toBlock: "latest",
        });
        var transactions = receivedEvents.length - totalTransactions;
        totalTransactions = receivedEvents.length;

        endTime = new Date();
        var timeDiff = endTime - startTime; //in ms
        timeDiff /= 1000;

        trxs.push(transactions);
        tps.push(transactions / timeDiff);
        startTime = new Date();
      }
      await sequencer.addTransaction(user1.address, user2.address, i + 1);
    }
    console.log("Sequencer TPS before shutdown");
    console.log(tps);

    await sequencer.shutDown();

    // Keep sending transactions when shutdown
    var tps = [];
    var trxs = [];
    var startTime, endTime;
    startTime = new Date();
    for (let i = 0; i < 80; i++) {
      if (i % 20 == 0) {
        // Try to publish batch with failed sequencer
        truffleAssert.reverts(
          sequencer.publishBatch(),
          "Sequencer must be Live",
          "Should revert when sequencer that is shutdown tries to publishBatch"
        );
        var receivedEvents = await bridge.getPastEvents("TransactionReceived", {
          fromBlock: 0,
          toBlock: "latest",
        });
        var transactions = receivedEvents.length - totalTransactions;
        totalTransactions = receivedEvents.length;

        endTime = new Date();
        var timeDiff = endTime - startTime; //in ms
        timeDiff /= 1000;

        trxs.push(transactions);
        tps.push(transactions / timeDiff);
        startTime = new Date();
      }
      await sequencer.addTransaction(user1.address, user2.address, i + 1);
    }
    console.log("Sequencer TPS during shutdown");
    console.log(tps);

    await sequencer.start();
    // Keep sending transactions after being restarted
    var tps = [];
    var trxs = [];
    var startTime, endTime;
    startTime = new Date();
    for (let i = 0; i < 200; i++) {
      if (i % 20 == 0) {
        await sequencer.publishBatch();
        var receivedEvents = await bridge.getPastEvents("TransactionReceived", {
          fromBlock: 0,
          toBlock: "latest",
        });
        var transactions = receivedEvents.length - totalTransactions;
        totalTransactions = receivedEvents.length;

        endTime = new Date();
        var timeDiff = endTime - startTime; //in ms
        timeDiff /= 1000;

        trxs.push(transactions);
        tps.push(transactions / timeDiff);
        startTime = new Date();
      }
      await sequencer.addTransaction(user1.address, user2.address, i + 1);
    }
    console.log("Sequencer TPS after restarting");
    console.log(tps);
  });
});
