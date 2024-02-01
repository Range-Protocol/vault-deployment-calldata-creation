const hre = require("hardhat");
const {ethers} = require("hardhat");

const configData = require("./config.json");

const TimelockInterface = new ethers.Interface([
	"function schedule(address,uint256,bytes,bytes32,bytes32,uint256)",
	"function execute(address,uint256,bytes,bytes32,bytes32)",
]);
const CreateVaultInterface = new ethers.Interface([
	"function createVault(address,address,uint24,address,bytes)",
]);
const CreateVaultInterfaceAlgebra = new ethers.Interface([
	"function createVault(address,address,uint24,address,bytes)",
]);
const IVaultCreatedEvent = new ethers.Interface([
	"event VaultCreated(address indexed, address indexed)",
]);
const IAMMFactory = new ethers.Interface([
	"function createPool(address tokenA, address tokenB,uint24 fee ) external"
]);
const BYTES32 =
	"0x0000000000000000000000000000000000000000000000000000000000000000";

async function main() {
	console.log(configData);
	const [acc] = await ethers.getSigners();
	
	// fund the multisig address
	await acc.sendTransaction({
		to: configData.multisig,
		value: ethers.parseEther("100"),
	});
	ethers.provider.accounts = "remote";
	await ethers.provider.send("hardhat_impersonateAccount", [
		configData.multisig,
	]);
	const sender = await ethers.provider.getSigner(configData.multisig);
	
	try {
		await sender.sendTransaction({
			to: configData.ammFactory,
			data: IAMMFactory.encodeFunctionData("createPool", [
				configData.token0,
				configData.token1,
				configData.fee
			])
		});
	} catch (e) {
		console.log(e);
	}
	
	// prepare the timelock schedule data
	let init_data;
	if (configData.name.includes("Pancakeswap")) {
		console.log("pancake")
		init_data = ethers.AbiCoder.defaultAbiCoder().encode(
			["address", "string", "string", "address"],
			[configData.manager, configData.name, configData.symbol, configData.WETH9],
		);
	}
	else {
		console.log("uniswap")
		init_data = ethers.AbiCoder.defaultAbiCoder().encode(
			["address", "string", "string"],
			[configData.manager, configData.name, configData.symbol],
		);
	}
	const create_vault_data =
		configData.fee !== 0
			? CreateVaultInterface.encodeFunctionData("createVault", [
				configData.token0,
				configData.token1,
				configData.fee,
				configData.implementation,
				init_data,
			])
			: CreateVaultInterfaceAlgebra.encodeFunctionData("createVault", [
				configData.token0,
				configData.token1,
				configData.implementation,
				init_data,
			]);
	const timelock_data = TimelockInterface.encodeFunctionData("schedule", [
		configData.factory,
		0,
		create_vault_data,
		BYTES32,
		BYTES32,
		86400,
	]);
	await sender.sendTransaction({
		to: configData.timelock,
		data: timelock_data,
	});
	console.log("Schedule payload:\n", timelock_data);
	
	await ethers.provider.send("evm_increaseTime", [864000]);
	await ethers.provider.send("evm_mine");
	
	const timelock = new ethers.Contract(
		configData.timelock,
		require("./TimelockABI.json"),
	);
	const txData = await (
		await timelock
			.connect(sender)
			.execute(configData.factory, 0, create_vault_data, BYTES32, BYTES32)
	).wait();
	
	txData.logs.forEach((log) => {
		const logParsed = IVaultCreatedEvent.parseLog(log);
		if (!!logParsed) {
			console.log();
			console.log("Pool: ", logParsed.args[0]);
			console.log("Vault: ", logParsed.args[1]);
		}
	});
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
