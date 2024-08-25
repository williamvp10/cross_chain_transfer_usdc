
import { ethers as ethlib } from "ethers";
import { ethers } from "hardhat";
import { getCCIPConfig } from "../ccip.config";

const USDCTokenAddress_fuji = "0x5425890298aed601595a70AB815c96711a31Bc65"; // USDC token address on Avalanche Fuji

async function main() {
  // Obtener el signer usando la PRIVATE_KEY
  const provider = ethers.provider; // Usamos el proveedor de Hardhat
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
  
  const avalancheConfig = getCCIPConfig("avalancheFuji");
  const sepoliaConfig = getCCIPConfig("ethereumSepolia");

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await provider.getBalance(deployer.address)).toString());


  // Step 1: Deploy TransferUSDC.sol to Avalanche Fuji
  const TransferUSDC = await ethers.getContractFactory("TransferUSDC");
  const transferUSDC = await TransferUSDC.deploy(
    avalancheConfig.router,
    avalancheConfig.linkToken,
    USDCTokenAddress_fuji
  );

  console.log("TransferUSDC deployed to:", transferUSDC);

  // Step 2: Allowlist Ethereum Sepolia chain selector on Avalanche Fuji
  const allowlistTx = await transferUSDC.allowlistDestinationChain(
    sepoliaConfig.chainSelector,
    true
  );
  await allowlistTx.wait();

  console.log(
    `Allowlisted Ethereum Sepolia chain (Selector: ${sepoliaConfig.chainSelector})`
  );

  // Step 3: Fund TransferUSDC.sol with 3 LINK on Avalanche Fuji
  const fundAmount = BigInt(3) * BigInt(10 ** 18);
  const LINK = await ethers.getContractAt("IERC20", avalancheConfig.linkToken);
  const fundTx = await LINK.transfer(
    transferUSDC,
    fundAmount // Usamos ethers.utils.parseUnits desde ethers directamente
  );
  await fundTx.wait();
  console.log("Funded TransferUSDC contract with 3 LINK");

  // Step 4: Approve 1 USDC to be spent by TransferUSDC.sol on Avalanche Fuji
  const USDC = await ethers.getContractAt(
    "IERC20",
    USDCTokenAddress_fuji
  );
  const approveTx = await USDC.approve(transferUSDC, 1000000);
  await approveTx.wait();
  console.log("Approved 1 USDC to be spent by TransferUSDC.sol");

  // Step 5: Call transferUsdc function on Avalanche Fuji
  const transferTx = await transferUSDC.transferUsdc(
    sepoliaConfig.chainSelector,
    deployer.address, // Your wallet address as the receiver
    1000000, // 1 USDC (6 decimals)
    0 // gasLimit = 0 since we're sending to an EOA
  );
  await transferTx.wait();
  console.log("Transferred 1 USDC to Ethereum Sepolia");

  console.log("Transaction Hash:", transferTx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
