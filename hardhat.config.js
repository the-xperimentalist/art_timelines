require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.4",
  defaultNetwork: "theta_testnet",
  networks: {
    theta_privatenet: {
      url: "http://localhost:18888/rpc",
      accounts: [
         "1111111111111111111111111111111111111111111111111111111111111111",
         "2222222222222222222222222222222222222222222222222222222222222222",
         "3333333333333333333333333333333333333333333333333333333333333333",
      ],
      chainId: 366,
      gasPrice: 4000000000000
    },
    theta_testnet: {
      url: `https://eth-rpc-api-testnet.thetatoken.org/rpc`,
      accounts: ["3333333333333333333333333333333333333333333333333333333333333333"],
      chainId: 365,
      gasPrice: 4000000000000
    },
    theta_mainnet: {
      url: `https://eth-rpc-api.thetatoken.org/rpc`,
      accounts: ["1111111111111111111111111111111111111111111111111111111111111111"],
      chainId: 361,
      gasPrice: 4000000000000
    },
  },
  paths: {
    artifacts: "./src/backend/artifacts",
    sources: "./src/backend/contracts",
    cache: "./src/backend/cache",
    tests: "./src/backend/test"
  },
};
