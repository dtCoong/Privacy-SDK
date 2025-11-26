require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
try {
  require("@nomiclabs/hardhat-etherscan");
} catch (e) {
  // etherscan plugin not installed; verification commands will be unavailable.
}

// Optional gas reporter plugin (will be a no-op if not installed)
try {
  require("hardhat-gas-reporter");
} catch (e) {
  // gas reporter not installed; fine for local runs without reporting
}
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.0",
  paths: {
    sources: "./packages/contracts/contracts",
    artifacts: "./packages/contracts/artifacts",
    cache: "./packages/contracts/cache",
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    hardhat: {
      blockGasLimit: 30000000,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },
  etherscan: {
    apiKey:
      process.env.ETHERSCAN_API_KEY ||
      process.env.SEPOLIA_ETHERSCAN_API_KEY ||
      "",
  },
  gasReporter: {
    enabled: process.env.GAS_REPORTER === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || undefined,
  },
};
