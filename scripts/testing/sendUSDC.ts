import { ethers, network } from "hardhat";
import { SupportedNetworks, getCCIPConfig } from "../../ccip.config";
import deployedContracts from "../generatedData.json";

// Función principal para enviar USDC
async function sendUSDC(
  currentNetwork: SupportedNetworks,
  destinationWallet: string
) {
  // Determinar la red de destino en función de la red actual
  const destinationNetwork: SupportedNetworks =
    currentNetwork === "ethereumSepolia" ? "avalancheFuji" : "ethereumSepolia";

    console.log(`Sending 1 USDC from ${currentNetwork} to ${destinationWallet} in ${destinationNetwork}`);  

    // validar manuelmente que destinationWallet sea una dirección válida
    if (!ethers.isAddress(destinationWallet)) {
      throw new Error("Invalid destination wallet address.");
    }
  // Obtener la dirección del contrato TransferUSDC en la red actual
  const transferUSDCAddress = (
    deployedContracts[currentNetwork] as { transferUsdcTokenAddress: string }
  ).transferUsdcTokenAddress;

  const transferUSDC = await ethers.getContractAt(
    "TransferUSDC",
    transferUSDCAddress
  );

  // Obtener la dirección del contrato USDC en la red actual
  const usdcTokenAddress = getCCIPConfig(currentNetwork).usdcToken;
  const USDC = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", usdcTokenAddress);

  // Establecer la cantidad de USDC a enviar (1 USDC)
  const usdcAmount = 1000000; // USDC tiene 6 decimales

  // Permitir que el contrato TransferUSDC gaste 1 USDC del deployer
  const approveTx = await USDC.approve(transferUSDCAddress, usdcAmount);
  await approveTx.wait();
  console.log(`Approved 1 USDC for spending by TransferUSDC contract`);

  // Configurar los parámetros para la transferencia de USDC
  const destinationChain = getCCIPConfig(destinationNetwork).chainSelector;
  const gasLimit = 0; // Ajusta según el cálculo de gas

  // Realizar la transferencia de USDC a través de CCIP
  const transferTx = await transferUSDC.transferUsdc(
    destinationChain,
    destinationWallet,
    usdcAmount,
    gasLimit
  );
  await transferTx.wait();

  console.log(
    `Sent 1 USDC from ${currentNetwork} to ${destinationNetwork}`
  );
  console.log(
    `transaction ${transferTx}`
  );
}

// Validación de argumentos y ejecución del script
async function main() {
    const destinationWallet = process.env.DESTINATION_WALLET;
    console.log("Destination wallet:", destinationWallet);
    if (!destinationWallet) {
      console.error("Please provide a destination wallet address as an environment variable.");
      process.exit(1);
    }
  
    await sendUSDC(network.name as SupportedNetworks, destinationWallet);
}

main().catch((error) => {
  console.error("Error sending USDC:", error);
  process.exit(1);
});
