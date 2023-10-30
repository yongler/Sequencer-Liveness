// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Layer1Bridge.sol";

contract Layer2Sequencer {
    // Define a struct for user transactions
    struct Transaction {
        address from;
        address to;
        uint256 value;
    }

    // Define arrays to store user transactions and batches
    Transaction[] public transactions;

    // Events
    event UserTransaction(address indexed from, address indexed to, uint256 value);

    event BatchPublished(address[] _from, address[] _to, uint256[] _values);

    event GetTransactions(address[] _from, address[] _to, uint256[] _values);

    // Boolean flag to indicate if the sequencer is live
    bool public isLive = true;

    // Address of the Layer1Bridge contract
    Layer1Bridge public layer1BridgeContract;

    // Constructor to set the Layer1Bridge address
    constructor(Layer1Bridge _layer1BridgeAddress) {
        layer1BridgeContract = _layer1BridgeAddress;
    }

    // Function to add a user transaction to the batch
    // to simulate user transaction being included into mempool
    function addTransaction(address _from, address _to, uint256 _value) external {

        emit UserTransaction(_from, _to, _value);
        transactions.push(Transaction(_from, _to, _value));
    }

    // Function to publish the batch to the Layer1Bridge contract
    function publishBatch() external {
        require(isLive, "Sequencer must be Live"); 
        require(transactions.length >= 5, "Sequencer must have >= 5 transactions"); 

        address[] memory _from = new address[](transactions.length);
        address[] memory _to = new address[](transactions.length);
        uint256[] memory _values = new uint256[](transactions.length);

        for (uint256 i = 0; i < transactions.length; i++) {
            _from[i] = transactions[i].from;
            _to[i] = transactions[i].to;
            _values[i] = transactions[i].value;
        }

        emit BatchPublished(_from, _to, _values);
        layer1BridgeContract.receiveBatch(_from, _to, _values);

        clearBatch();
        
    }

    // Function to clear the batch after publishing
    function clearBatch() internal {
        delete transactions;
    }

    // Function to shut down the sequencer
    function shutDown() external {
        isLive = false;
    }

    // Function to start the sequencer
    function start() external {
        isLive = true;
    }

    // Getter functions
    function getTransactions() public view returns (Transaction[] memory) {
        return transactions;
    }

    function getIsLive() public view returns (bool) {
        return isLive;
    }
}
