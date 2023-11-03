// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const {ethers} = require("hardhat");
const {TimelockInterface, CreateVaultInterface} = require("./common");

async function main() {
  const timelock_address = "0x56D9901451a7a753Ac8251F355951E582691D3a0";
  const factory_address = "0x3E89E72026DA6093DD6E4FED767f1f5db2fc0Fb4";
  const manager = "0x596b79a977f59D8F282B44102964E49Bd171d9E1";
  const tokenA = "0xb829b68f57CC546dA7E5806A929e53bE32a4625D";
  const tokenB = "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111";
  const fee = 100;
  const impl_address = "0xDf364639071BD92De439f432aFdF9db2Bbe78A98";
  const name = "Range Agni WETH/axlETH 0.01% Pegged LP";
  const symbol = "R-UNI";
  
  
  const init_data = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "string", "string"],
    [manager, name, symbol]
  );
  const create_vault_data = CreateVaultInterface.encodeFunctionData("createVault", [
    tokenA,
    tokenB,
    fee,
    impl_address,
    init_data
  ]);
  console.log("CREATE PAYLOAD:\n", create_vault_data);
  console.log("\n");
  const timelock_data = TimelockInterface.encodeFunctionData("schedule", [
    factory_address,
    0,
    create_vault_data,
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    86400
  ]);
  console.log("TIMELOCK PAYLOAD:\n", timelock_data)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
