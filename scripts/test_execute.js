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
	const [acc] = await ethers.getSigners();
	const timelock_address = "0x56D9901451a7a753Ac8251F355951E582691D3a0";
	const factory_address = "0x3E89E72026DA6093DD6E4FED767f1f5db2fc0Fb4";
	const manager = "0x596b79a977f59D8F282B44102964E49Bd171d9E1";
	const tokenA = "0xb829b68f57CC546dA7E5806A929e53bE32a4625D";
	const tokenB = "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111";
	const fee = 100;
	const impl_address = "0xDf364639071BD92De439f432aFdF9db2Bbe78A98";
	const name = "Range Agni WETH/axlETH 0.01% Pegged LP";
	const symbol = "R-UNI";
	
	const ms = "0xb5020eC695b256b0F813547189B523c267737d46";
	await acc.sendTransaction({
		to: ms,
		value: ethers.parseEther("100")
	})
	ethers.provider.accounts = "remote";
	await ethers.provider.send(
	    'hardhat_impersonateAccount',
	    [ms] // copy your account address here
	);
	
	const sender = await ethers.provider.getSigner(ms);
	await sender.sendTransaction({
		to: timelock_address,
	})
	await sender.sendTransaction({
		to: timelock_address,
		data: "0x01d5062a0000000000000000000000003e89e72026da6093dd6e4fed767f1f5db2fc0fb4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001518000000000000000000000000000000000000000000000000000000000000001c42204d63e000000000000000000000000b829b68f57cc546da7e5806a929e53be32a4625d000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead11110000000000000000000000000000000000000000000000000000000000000064000000000000000000000000df364639071bd92de439f432afdf9db2bbe78a9800000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000596b79a977f59d8f282b44102964e49bd171d9e1000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000002652616e67652041676e6920574554482f61786c45544820302e30312520506567676564204c5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005522d554e4900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
	});

	await ethers.provider.send("evm_increaseTime", [864000])
	await ethers.provider.send("evm_mine")

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
	
	const timelock = new ethers.Contract(timelock_address, require("./TimelockABI.json"));
	const txData = await (await timelock.connect(sender).execute(
		factory_address,
		0,
		create_vault_data,
		"0x0000000000000000000000000000000000000000000000000000000000000000",
		"0x0000000000000000000000000000000000000000000000000000000000000000",
	)).wait();

	const IVaultCreatedEvent = new ethers.Interface([
		"event VaultCreated(address indexed, address indexed)"
	])
	txData.logs.forEach(log => {
		const logParsed = IVaultCreatedEvent.parseLog(log);
		if (!!logParsed) {
			console.log()
			console.log("Pool: ", logParsed.args[0]);
			console.log("Vault: ", logParsed.args[1]);
		}
	})
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
