import { ethers } from "hardhat";
import { getCCIPConfig } from "../ccip.config";
const USDCTokenAddress_sepolia = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // USDC token address on Avalanche Fuji


async function main() {
  // Obtener el signer usando la PRIVATE_KEY
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);

  const sepoliaConfig = getCCIPConfig("ethereumSepolia");
  const avalancheConfig = getCCIPConfig("avalancheFuji");

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Step 1: Deploy TransferUSDC.sol to Ethereum Sepolia

  /*
  const TransferUSDC = await ethers.getContractFactory("TransferUSDC", deployer);
  const transferUSDC = await TransferUSDC.deploy(
    sepoliaConfig.router,
    sepoliaConfig.linkToken,
    USDCTokenAddress_sepolia
  );
  */
  // Usar la dirección del contrato desplegado en Sepolia
  const transferUSDCAddress = "0x0247970Bd0c8A69B299993D55362ba41CD251EAe";
  const transferUSDC = await ethers.getContractAt("TransferUSDC", transferUSDCAddress, deployer);
  
  console.log("TransferUSDC deployed to:", await transferUSDC.getAddress());
  console.log("TransferUSDC deployed to:", transferUSDC);

  // Step 2: Allowlist Avalanche Fuji chain selector on Sepolia
  
  const allowlistTx = await transferUSDC.allowlistDestinationChain(
    avalancheConfig.chainSelector,
    true
  );
  await allowlistTx.wait();
  console.log(
    `Allowlisted Avalanche Fuji chain (Selector: ${avalancheConfig.chainSelector})`
  );
  
  // Step 3: Fund TransferUSDC.sol with 3 LINK on Sepolia
  const LINK = await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", 
    sepoliaConfig.linkToken, 
    deployer);
  const fundAmount = BigInt(1) * BigInt(10 ** 18); // Calculamos 3 LINK en wei manualmente
  const fundTx = await LINK.transfer(transferUSDCAddress, fundAmount);
  await fundTx.wait();
  console.log("Funded TransferUSDC contract with 2 LINK");
  console.log(fundTx);

  // Step 4: Approve 1 USDC to be spent by TransferUSDC.sol on Sepolia
  const USDC = await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    USDCTokenAddress_sepolia,
    deployer
  );
  const approveTx = await USDC.approve(transferUSDC, 1000000);
  await approveTx.wait();
  console.log("Approved 1 USDC to be spent by TransferUSDC.sol");
  console.log(approveTx);
  
  // Step 5: Call transferUsdc function on Sepolia
  const transferTx = await transferUSDC.transferUsdc(
    avalancheConfig.chainSelector,
    deployer.address, // Your wallet address as the receiver
    1000000, // 1 USDC (6 decimals)
    0 // gasLimit = 0 since we're sending to an EOA
  );
  await transferTx.wait();
  console.log("Transferred 1 USDC to Avalanche Fuji");

  console.log("Transaction:", transferTx);

  console.log("Transaction Hash:", transferTx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
