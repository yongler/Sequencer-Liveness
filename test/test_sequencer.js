const truffleAssert = require("truffle-assertions");

const Layer2User = artifacts.require("Layer2User");
const Layer1Bridge = artifacts.require("Layer1Bridge");
const Layer2Sequencer = artifacts.require("Layer2Sequencer");

contract("Layer2Sequencer", (accounts) => {
  let user1;
  let user2;
  let bridge;
  let sequencer;

  beforeEach(async () => {
    user1 = await Layer2User.new(20); // Initialize with an initial supply of 20 tokens
    user2 = await Layer2User.new(20); // Initialize with an initial supply of 20 tokens
    bridge = await Layer1Bridge.new();
    sequencer = await Layer2Sequencer.new(bridge.address);
  });

  it("layer 2 sequencer should emit the batchPublished event after 5 transactions", async () => {
    for (let i = 0; i < 5; i++) {
      await sequencer.addTransaction(user1.address, user2.address, i + 1);
    }

    var trxs = await sequencer.getTransactions();
    assert.equal(trxs.length, 5, "Transactions were not removed properly");

    // publish batch and check
    await sequencer.publishBatch();

    var receivedEvents = await bridge.getPastEvents("BatchReceived", {
      fromBlock: "latest",
    });
    assert.equal(receivedEvents.length, 1, "BatchReceived event not emitted");
  });

  it("layer 2 sequencer should not publish batch if shutdown", async () => {
    // shutdown
    await sequencer.shutDown();
    console.log("sequencer is now", await sequencer.getIsLive());

    var trxs = await sequencer.getTransactions();
    assert.equal(
      trxs.length,
      0,
      "Transactions were published when sequencer was shutdown"
    );

    // send 5 trx and check
    for (let i = 0; i < 5; i++) {
      await sequencer.addTransaction(user1.address, user2.address, i + 1);
    }
    var trxs = await sequencer.getTransactions();
    assert.equal(
      trxs.length,
      5,
      "Transactions were published when sequencer was shutdown"
    );

    // try to publish, check that transaction still there
    truffleAssert.reverts(
      sequencer.publishBatch(),
      "Sequencer must be Live",
      "Should revert when sequencer that is shutdown tries to publishBatch"
    );

    var trxs = await sequencer.getTransactions();
    assert.equal(
      trxs.length,
      5,
      "Transactions were published when sequencer was shutdown"
    );
    // var trxs = await sequencer.getTransactions();
    // assert.equal(
    //   trxs.length,
    //   5,
    //   "Transactions were published when sequencer was shutdown"
    // );

    // // check for batchreceived
    // var receivedEvents = await bridge.getPastEvents("BatchReceived", {
    //   fromBlock: "latest",
    // });
    // assert.equal(
    //   receivedEvents.length,
    //   0,
    //   "BatchReceived event emitted when sequencer was shutdown"
    // );

    // console.log("=============test=============");
    // var trxs = await sequencer.getTransactions();
    // console.log(trxs);
    // assert.equal(
    //   trxs.length,
    //   0,
    //   "Transactions were published when sequencer was shutdown"
    // );
  });

  it("layer 2 sequencer should publish batch if started back to live", async () => {
    console.log("======hello====================");
    await sequencer.start();
    console.log("sequencer is now", await sequencer.getIsLive());
    // check 5 transactions from when sequencer was shutdown is still there
    var trxs = await sequencer.getTransactions();
    assert.equal(trxs.length, 5, "Transactions is not persistent");

    // await sequencer.addTransaction(user1.address, user2.address, 6);

    // send 5 trx and check
    // for (let i = 0; i < 5; i++) {
    //   await sequencer.addTransaction(user1.address, user2.address, i + 1);
    // }

    // publish batch and check
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
