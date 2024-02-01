const { ethers } = require("hardhat");

const TimelockInterface = new ethers.Interface([
	"function schedule(address,uint256,bytes,bytes32,bytes32,uint256)",
	"function execute(address,uint256,bytes,bytes32,bytes32)",
]);
const UpgradeVaultInterface = new ethers.Interface([
	"function upgradeVault(address,address)",
]);

async function main() {
	const [acc] = await ethers.getSigners();
	const timelock_address = "0x21E0803103d3cf8Ab0755a02e9e4F55a5590E07F";
	const factory_address = "0x3edeA0E6E94F75F86c62E1170a66f4e3bD7d77fE";
	
	const vault = "0x9dD90073c24269D4DD8d50708EE27ef6eEf53332";
	const implementation = "0xb25071dcdffb946230FE2fFcEB589AdACe440c11";
	
	const ms = "0xc4Cc24e55a966dB36f507B07fb5935E939bd7b95";
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
	//
	const slot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
	console.log("impl before: ", await ethers.provider.getStorage(vault, slot));
	
	const upgradeData = UpgradeVaultInterface.encodeFunctionData("upgradeVault", [
		vault,
		implementation
	]);

	const upgradeScheduleData = TimelockInterface.encodeFunctionData("schedule", [
		factory_address,
		0,
		upgradeData,
		"0x0000000000000000000000000000000000000000000000000000000000000000",
		"0x0000000000000000000000000000000000000000000000000000000000000000",
		86400
	]);

	console.log("Schedule data: ", upgradeScheduleData);
	
	await sender.sendTransaction({
		to: timelock_address,
		data: upgradeScheduleData
	});

	await ethers.provider.send("evm_increaseTime", [864000])
	await ethers.provider.send("evm_mine");

	const timelock = new ethers.Contract(timelock_address, require("./TimelockABI.json"));
	await timelock.connect(sender).execute(
		factory_address,
		0,
		upgradeData,
		"0x0000000000000000000000000000000000000000000000000000000000000000",
		"0x0000000000000000000000000000000000000000000000000000000000000000"
	);
	console.log("impl after: ", await ethers.provider.getStorage(vault, slot));
}

main();