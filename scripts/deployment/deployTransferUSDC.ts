import { ethers, run, network } from "hardhat";
import { SupportedNetworks, getCCIPConfig } from "../../ccip.config";
import { createOrUpdateConfigFile } from "../helper";

/**
 * Deploys and verifies the TransferUSDC contract on a specified network.
 * @param network The network where the TransferUSDC contract will be deployed.
 */
async function deployAndVerifyTransferUSDC(network: SupportedNetworks) {
  // Retrieve router, linkToken, and usdcToken addresses for the specified network.
  const { router, linkToken, usdcToken } = getCCIPConfig(network);

  console.log(`Deploying TransferUSDC contract on ${network}...`);
  
  // Create a contract factory for the "TransferUSDC" contract.
  const TransferUSDC = await ethers.getContractFactory("TransferUSDC");
  
  // Deploy the TransferUSDC contract with router, linkToken, and usdcToken as constructor arguments.
  const transferUSDC = await TransferUSDC.deploy(router, linkToken, usdcToken);

  // Wait for the contract deployment transaction to be mined.
  await transferUSDC.waitForDeployment();
  
  // Retrieve the transaction used for deploying the contract.
  const tx = transferUSDC.deploymentTransaction();
  
  if (tx) {
    console.log("Waiting for 20 blocks confirmations...");
    
    // Wait for 20 confirmations to ensure the transaction is well-confirmed on the network.
    await tx.wait(20);

    // Get the deployed contract address.
    const transferUSDCAddress = await transferUSDC.getAddress();
    console.log("TransferUSDC contract deployed at:", transferUSDCAddress);

    console.log(`Verifying TransferUSDC contract on ${network}...`);
    try {
      // Attempt to verify the contract on Etherscan (or similar explorer for the specified network).
      await run("verify:verify", {
        address: transferUSDCAddress,
        constructorArguments: [router, linkToken, usdcToken],
      });
      console.log(`TransferUSDC contract verified on ${network}!`);
    } catch (error) {
      console.error("Error verifying TransferUSDC contract:", error);
    }

    // Update the configuration file with the new contract address.
    await createOrUpdateConfigFile(network, {transferUsdcTokenAddress: transferUSDCAddress});
  }
}

// Execute the deployment and verification process for the current network.
deployAndVerifyTransferUSDC(network.name as SupportedNetworks).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
