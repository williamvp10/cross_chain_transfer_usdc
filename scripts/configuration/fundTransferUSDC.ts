import { ethers, network } from "hardhat";
import { SupportedNetworks, getCCIPConfig } from "../../ccip.config";
import deployedContracts from "../generatedData.json";

async function fundTransferUSDC(currentNetwork: SupportedNetworks) {
  // Obtener la dirección del contrato TransferUSDC en la red actual
  const transferUSDCAddress = (
    deployedContracts[currentNetwork] as { transferUsdcTokenAddress: string }
  ).transferUsdcTokenAddress;

  // Obtener el contrato LINK en la red actual
  const linkTokenAddress = getCCIPConfig(currentNetwork).linkToken;
  const LINK = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", linkTokenAddress);

  // Establecer la cantidad de LINK a transferir (en este caso 3 LINK)
  const fundAmount = BigInt(1) * BigInt(10 ** 18); 
  // Transferir LINK al contrato TransferUSDC
  const fundTx = await LINK.transfer(transferUSDCAddress, fundAmount);
  await fundTx.wait();

  console.log(`Funded TransferUSDC contract with 3 LINK on ${currentNetwork}`);
}

// Ejecutar la función para la red actual
fundTransferUSDC(network.name as SupportedNetworks).catch((error) => {
  console.error("Error funding TransferUSDC contract:", error);
  process.exit(1);
});
