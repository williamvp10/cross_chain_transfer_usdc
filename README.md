# Day 3 Homework - Chainlink CCIP Bootcamp

## Overview

This repository contains the solution for the Day 3 homework assignment of the Chainlink CCIP Bootcamp. The task involves measuring the gas consumption of the `ccipReceive` function, increasing it by 10%, and then providing this as the `gasLimit` parameter in the `transferUsdc` function, instead of the previously hard-coded value of 500,000.

## Task Instructions

1. **Measure Gas Consumption**: 
   - Follow the tutorial provided by Chainlink to measure the gas consumption of the `ccipReceive` function.
   - Based on the measurements, calculate a 10% buffer to ensure that the gas limit is adequate for safe execution.

2. **Adjust Gas Limit**:
   - Update the `transferUsdc` function with the new gas limit value, incorporating the 10% buffer.

## Resources

- [CCIPReceive Gas Limit Tutorial](https://docs.chain.link/ccip/tutorials/ccipreceive-gaslimit)
- [Chainlink Gitbook Guide](https://cll-devrel.gitbook.io/ccip-masterclass/)


## Links

- **CCIP Transaction**: [View on CCIP Explorer](https://ccip.chain.link/msg/0x2366aed4af37f548847fa7fe106168bd75ef9690bee9959c0157a6a13900253a)
- **Deployed Contract on Fuji**: [View on Snowtrace](https://testnet.snowtrace.io/address/0xB643735216fc0bEe4bDFAf7b2087b2D4DAAE924C)

## How to Run

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/williamvp10/cross_chain_transfer_usdc.git
    cd cross_chain_transfer_usdc
    ```

2. **Install Dependencies**:
    ```bash
    npm install
    ```

3. **Set Up Environment Variables**:
    - Use `env-enc` to securely store and use environment variables.
    ```bash
    npx env-enc set-pw
    npx env-enc set PRIVATE_KEY your_private_key
    npx env-enc set ETHEREUM_SEPOLIA_RPC_URL your_sepolia_rpc_url
    npx env-enc set AVALANCHE_FUJI_RPC_URL your_fuji_rpc_url
    npx env-enc set ETHERSCAN_API_KEY ether_scan_api_key
    npx env-enc set DESTINATION_WALLET 0x3......
    ```
4. **Run Gas Estimation and Update Gas Limit**:
    - Follow the provided tutorial to measure gas consumption.
    - Update the `transferUsdc` function with the calculated gas limit.
    ### Results test Gas Limits


| **Scenario**              | **Number of iterations** | **Original Gas Limit** | **Buffered Gas Limit (+10%)** | **Message ID**                                                |
|---------------------------|--------------------------|------------------------|-------------------------------|----------------------------------------------------------------|
| Baseline gas consumption   | 0                        | 5685                   | 6254                          | `0xdcd879d7227197e7571cb4fb49844ab7de60b07a3804f4fd1fb3b01020cc8755` |
| Average gas consumption    | 50                       | 16190                  | 17809                         | `0x5ba91ddf754a5e17673ae9eb62a9aeb616a9312878930ad2eeacb25dbda6439a` |
| Peak gas consumption       | 99                       | 26485                  | 29134                         | `0xcffabc4b5d4366bf11d8cd71ac78fede1d1f58a6af031d6f943e7614c8652bac` |


----
## run TransferUSDC
4. **Deploy Contracts(fuji)**:
    ```bash
    npx hardhat run scripts/deployment/deployTransferUSDC.ts --network avalancheFuji
    ```

5. **Allowlist Destination Chain**  
   Authorize the destination chain (Ethereum Sepolia) so that `TransferUSDC` can transfer USDC tokens.
   ```bash
   npx hardhat run scripts/configuration/allowlistingForTransferUSDC.ts --network ethereumSepolia
   ```
6. **Fund `TransferUSDC` with LINK on Avalanche Fuji**  
   Provide the `TransferUSDC` contract with enough LINK to cover CCIP fees.

   ```bash
   npx hardhat run scripts/configuration/fundTransferUSDC.ts --network avalancheFuji
   ```
7. **Execute Transfer**: Approve USDC for Use by `TransferUSDC` and Transfer USDC from Avalanche Fuji to Ethereum Sepoli
    ```bash
    npx hardhat run scripts/testing/sendUSDC.ts --network avalancheFuji
    ```


-----



# CCIP gas estimator using Hardhat

This guide is designed to help you accurately estimate the gas consumption of the `ccipReceive` function within a CCIP Receiver contract. Understanding the gas dynamics of this function is crucial for setting an appropriate gasLimit when sending a CCIP message from the Sender contract.

The `ccipReceive` function is crafted for educational purposes to demonstrate how gas consumption changes with computational complexity. It is structured to accept a `uint256` input representing the number of iterations a loop within the function will execute. This input is decoded from the received CCIP message as follows:

```solidity
uint256 iterations = abi.decode(any2EvmMessage.data, (uint256)); // abi-decoding of the receiver number of iterations
```

To mitigate excessive gas consumption and ensure predictability, the iterations variable is internally capped at `99`. The function achieves this by performing the modulo operation `iterations % 100`, thereby limiting the maximum number of iterations to `99`. The core logic of the function, including the iteration cap and the loop, is outlined below:

```solidity
// Initialize the result with the number of iterations
uint256 result = iterations;
// Cap the number of iterations to a maximum of 99
uint256 maxIterations = iterations % 100;

// Execute the loop, simulating computational work
for (uint256 i = 0; i < maxIterations; i++) {
    result += i;
}
```

By experimenting with different iterations values, developers can gain insights into optimal gas limit settings.

### Prerequisites

- Make sure to install all the dependencies

````bash
npm install
```

- Set the password to encrypt your environment variables

```bash
npx env-enc set-pw
````

- Setup this environment variables:

  - `PRIVATE_KEY`
  - `ETHEREUM_SEPOLIA_RPC_URL`
  - `AVALANCHE_FUJI_RPC_URL`
  - `ETHERSCAN_API_KEY`

  using the following command:

  ```bash
  npx env-enc set
  ```

## Local testing

```bash
npx hardhat test
```

Example output:

```text
$ npx hardhat test

  Sender and Receiver
Final Gas Usage Report:
Number of iterations 0 - Gas used: 5168
Number of iterations 50 - Gas used: 14718
Number of iterations 99 - Gas used: 24077
    ✔ should CCIP message from sender to receiver (1007ms)


  1 passing (1s)
```

As you can notice from the output, the gas usage increases with the number of iterations. This is a crucial insight for setting the gasLimit when sending a CCIP message from the Sender contract. The maximum gas usage is observed when the number of iterations is set to `99` (gas: `24077`).

## Testnet testing

The Sender is deployed on Avalanche Fuji and the Receiver is deployed on Ethereum Sepolia.

### Deploy and configure

1. Deploy Sender on Avalanche Fuji:

```bash
npx hardhat run scripts/deployment/deploySender.ts --network avalancheFuji
```

1. Deploy Receiver on Ethereum Sepolia:

```bash
npx hardhat run scripts/deployment/deployReceiver.ts --network ethereumSepolia
```

1. Allow the Sender to send messages to Ethereum Sepolia:

```bash
npx hardhat run scripts/configuration/allowlistingForSender.ts --network avalancheFuji
```

1. Allow the Receiver to receiver messages from the Sender:

```bash
npx hardhat run scripts/configuration/allowlistingForReceiver.ts --network ethereumSepolia
```

### Test

1. Send three CCIP messages with different number of iterations:

```bash
npx hardhat run scripts/testing/sendCCIPMessages.ts --network avalancheFuji
```

Example output

```text
$ npx hardhat run scripts/testing/sendCCIPMessages.ts --network avalancheFuji
Approving 0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846 for 0x32A24e40851E19d1eD2a7E697d1a38228e9388a3. Allowance is 115792089237316195423570985008687907853269984665640564039457584007913129639935. Signer 0x9d087fC03ae39b088326b67fA3C788236645b717...
115792089237316195423570985008687907853269984665640564039457584007913129639935n

Number of iterations 0 - Gas limit: 5685 - Message Id: 0xf23b17366d69159ea7d502835c4178a1c1d1d6325edf3d91dca08f2c7a2900f7
Number of iterations 50 - Gas limit: 16190 - Message Id: 0x4b3a97f6ac959f67d769492ab3e0414e87fdd9c143228f9c538b22bb695ca728
Number of iterations 99 - Gas limit: 26485 - Message Id: 0x37d1867518c0f8c54ceb0c5507b46b8d44c6c53864218f448cba0234f8de867a
```

1. Go to the [CCIP explorer](https://ccip.chain.link) and wait for each message to be successfully transmitted (Status in the explorer: `Success`).

For the example above, here below the destination transaction hashes:

| Message id                                                         | Ethereum Sepolia transaction hash                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 0xf23b17366d69159ea7d502835c4178a1c1d1d6325edf3d91dca08f2c7a2900f7 | 0xf004eb6dab30b3cfb9d1d631c3f9832410b8d4b3179e65b85730563b67b1e689 |
| 0x4b3a97f6ac959f67d769492ab3e0414e87fdd9c143228f9c538b22bb695ca728 | 0xf004eb6dab30b3cfb9d1d631c3f9832410b8d4b3179e65b85730563b67b1e689 |
| 0x37d1867518c0f8c54ceb0c5507b46b8d44c6c53864218f448cba0234f8de867a | 0xf004eb6dab30b3cfb9d1d631c3f9832410b8d4b3179e65b85730563b67b1e689 |

**Note** that the Ethereum Sepolia transaction hash is the same for all the messages. This is because CCIP batched the messages.

1. Open [Tenderly](https://dashboard.tenderly.co) and Search for the [destination transaction hash](https://dashboard.tenderly.co/tx/sepolia/0xf004eb6dab30b3cfb9d1d631c3f9832410b8d4b3179e65b85730563b67b1e689).

1. Search for `_callWithExactGasSafeReturnData` that has payload containing your messageId (without `0x`). This is an [example](https://dashboard.tenderly.co/tx/sepolia/0xf004eb6dab30b3cfb9d1d631c3f9832410b8d4b3179e65b85730563b67b1e689?trace=0.8.4.2) for `0xf23b17366d69159ea7d502835c4178a1c1d1d6325edf3d91dca08f2c7a2900f7`.

1. Just below it, you will find the call trace from the Router to your Receiver contract. This is the [trace](https://dashboard.tenderly.co/tx/sepolia/0xf004eb6dab30b3cfb9d1d631c3f9832410b8d4b3179e65b85730563b67b1e689?trace=0.8.4.2.0).

1. Click on the debugger and you'll get the gas details:

```text
"gas":{
"gas_left":5685
"gas_used":5031
"total_gas_used":7994315
}
```

1. Note the `gas_left`is equal to the limit that is set in the `sendCCIPMessages.ts` script: `5685`. The `gas_used` is the actual gas used by the Receiver contract to process the message.

1. Repeating the same steps for the other two messages, we can summarize the output:

| Number of iterations | Gas used during local testing | Gas limit on testnet | Gas used on testnet |
| -------------------- | ----------------------------- | -------------------- | ------------------- |
| 0                    | 5168                          | 5685                 | 5031                |
| 50                   | 14718                         | 16190                | 14581               |
| 99                   | 24077                         | 26485                | 23940               |

**Remark**: Compare this with the results from the [Foundry guide](../foundry/README.md).
