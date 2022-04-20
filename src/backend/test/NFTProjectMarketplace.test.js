const { expect } = require("chai");

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)

describe("NFTProjectMarketplace", function() {
  let deployer, addr1, addr2, nft, nftprojectmarket, addrs;
  let feePercent = 1;
  let testURI = "Sample URI";

  beforeEach(async function () {
      const NFT = await ethers.getContractFactory("NFT");
      const NFTProjectMarket = await ethers.getContractFactory("NFTProjectMarketplace");

      [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

      nft = await NFT.deploy()
      nftprojectmarket = await NFTProjectMarket.deploy()
  })
})
