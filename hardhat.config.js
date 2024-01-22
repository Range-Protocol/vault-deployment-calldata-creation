require("@nomicfoundation/hardhat-toolbox");
const configData = require("./scripts/config.json");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: configData.rpc
      }
    }
  },
  solidity: "0.8.19",
};
