const Layer2User = artifacts.require("Layer2User");
const Layer1Bridge = artifacts.require("Layer1Bridge");
const Layer2Sequencer = artifacts.require("Layer2Sequencer");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(Layer2User).then(() => {
    return deployer.deploy(Layer1Bridge);
  }).then(() => {
    return deployer.deploy(Layer2Sequencer, Layer1Bridge.address);
  });
};
