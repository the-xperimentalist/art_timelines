const { expect } = require("chai");

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)

describe("NFTProjectMarketplace", function() {
  let deployer, addr1, addr2, nft, nftprojectmarket, addrs;
  let feePercent = 1;
  let sellTimeDelay = 600000; // 10 mins
  let testURI = "Sample URI";

  beforeEach(async function () {
      const NFT = await ethers.getContractFactory("NFT");
      const NFTProjectMarket = await ethers.getContractFactory("NFTProjectMarketplace");

      [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

      nft = await NFT.deploy()
      nftprojectmarket = await NFTProjectMarket.deploy(feePercent, sellTimeDelay)
  })

  describe("Deployment", function () {
    it("Should track symbol of nft collection", async function () {
      expect(await nft.name()).to.equal("Art timeline NFT")
      expect(await nft.symbol()).to.equal("ARTN")
    })
    it("Should track details of the marketplace collection", async function () {
      expect(await nftprojectmarket.feeAccount()).to.equal(deployer.address)
      expect(await nftprojectmarket.feePercent()).to.equal(feePercent)
      expect(await nftprojectmarket.sellTimeDelay()).to.equal(sellTimeDelay)
    })
  })
})
