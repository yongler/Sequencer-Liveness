# Layer2 Sequencer Demo

## Background

This repository demonstrates the liveness issues often associated with centralized sequencers. In the context of layer 2 rollup systems, a sequencer plays a critical role in processing and batching user transactions. However, if the sequencer encounters disruptions or goes offline, the entire rollup may come to a halt.

The simulated sequencer within this codebase functions akin to a mempool, allowing the reception of user transactions. It can also publish batches of transactions to a bridge contract. Additionally, it includes a shutdown and start function to mimic sequencer malfunctions. The primary goal is to examine the behavior of the ecosytem by observing whether the bridge contract receives transaction batches when the sequencer encounters downtime.

## Dependencies

This repository requires these softwares to be installed:

1. npm
2. ganache

## Setup

To install and navigate this repository, follow the steps below:

1. Clone the repository from GitHub
2. Navigate to the project director
3. Install the dependencies with `npm install` in the root directory.
4. To run the demonstration, execute the following command in the root directory:
   `truffle test`
