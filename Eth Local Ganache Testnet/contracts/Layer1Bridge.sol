// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Layer1Bridge {
    // Event to log batch details
    event BatchReceived(address[] _from, address[] _to, uint256[] _values);
    event TransactionReceived(address _from, address _to, uint256 _value);

    // Function to receive batches from the Layer 2 sequencer
    function receiveBatch(address[] calldata _from, address[] calldata _to, uint256[] calldata _values) external {
        require(
            _from.length == _to.length && _to.length == _values.length,
            "Invalid batch data"
        );
        emit BatchReceived(_from, _to, _values);

        for (uint i = 0; i < _from.length; i++) {
            emit TransactionReceived(_from[i], _to[i], _values[i]);
        }
    }
}

