// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Layer2User {
    // Define a mapping to store user balances
    mapping(address => uint256) public balances;

    // Event to log transfer details
    event Transfer(address indexed from, address indexed to, uint256 value);

    // Function to deposit funds to the contract
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // Function to make a transfer to another layer 2 user
    function transfer(address _to, uint256 _value) external {
        require(balances[msg.sender] >= _value, "Insufficient balance");
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
    }
}
