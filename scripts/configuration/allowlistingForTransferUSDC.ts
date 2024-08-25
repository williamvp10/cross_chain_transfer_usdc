import { ethers, network } from "hardhat";
import { SupportedNetworks, getCCIPConfig } from "../../ccip.config";
import deployedContracts from "../generatedData.json";

async function allowlistingForTransferUSDC(currentNetwork: SupportedNetworks) {
  // Obtiene la dirección del contrato TransferUSDC para la red actual
  const transferUSDCAddress = (
    deployedContracts[currentNetwork] as { transferUsdcTokenAddress: string }
  ).transferUsdcTokenAddress;

  const transferUSDC = await ethers.getContractAt(
    "TransferUSDC",
    transferUSDCAddress
  );

  // Itera sobre cada red soportada configurada en deployedContracts
  for (const network in deployedContracts) {
    const supportedNetwork = network as SupportedNetworks;
    const { chainSelector } = getCCIPConfig(supportedNetwork);

    if (chainSelector) {
      // Permitir la lista blanca de la cadena de destino
      const allowlistTx = await transferUSDC.allowlistDestinationChain(
        chainSelector,
        true
      );
      await allowlistTx.wait();

      console.log(`Allowlisted: ${supportedNetwork} with Chain Selector: ${chainSelector}`);
    }
  }
}

allowlistingForTransferUSDC(network.name as SupportedNetworks).catch((error) => {
  console.error(error);
  process.exit(1);
});
