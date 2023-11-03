const {ethers} = require("hardhat");

const TimelockInterface = new ethers.Interface([
	"function schedule(address,uint256,bytes,bytes32,bytes32,uint256)",
	"function execute(address,uint256,bytes,bytes32,bytes32)"
]);

const CreateVaultInterface = new ethers.Interface([
	"function createVault(address,address,uint24,address,bytes)"
]);

module.exports = {
	TimelockInterface,
	CreateVaultInterface
}