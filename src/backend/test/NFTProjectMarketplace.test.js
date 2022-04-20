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

  describe("Minting NFTs", function() {
    it("Should track each minted NFT", async function() {
      // Addr1 mints nft
      await nft.connect(addr1).mint(testURI)
      expect(await nft.tokenCount()).to.equal(1)
      expect(await nft.balanceOf(addr1.address)).to.equal(1)
      expect(await nft.tokenURI(1)).to.equal(testURI)

      // Addr2 mints nft
      await nft.connect(addr2).mint(testURI)
      expect(await nft.tokenCount()).to.equal(2)
      expect(await nft.balanceOf(addr1.address)).to.equal(1)
      expect(await nft.tokenURI(2)).to.equal(testURI)
    })
  })

  describe("Creating marketplace projects", function () {
    let basePrice = 1
    beforeEach(async function() {
      await nft.connect(addr1).mint(testURI)
      await nft.connect(addr1).setApprovalForAll(nftprojectmarket.address, true)
    })
    it("Should create the project with valid price, token etc and emit related events",
      async function () {
      await expect(nftprojectmarket.connect(addr1).makeProject(nft.address, 1, toWei(basePrice), "Test Project", "Test Project Description"))
        .to.emit(nftprojectmarket, "NFTAdded")
        .to.emit(nftprojectmarket, "NewBid")
        .to.emit(nftprojectmarket, "ProjectAdd")

      // Basic setup for nft and project market contracts
      expect(await nft.ownerOf(1)).to.equal(nftprojectmarket.address)
      expect(await nftprojectmarket.projectCount()).to.equal(1)

      // Test first project's details
      const projectFirst = await nftprojectmarket.projects(1)
      expect(projectFirst.projectId).to.equal(1)
      expect(projectFirst.name).to.equal("Test Project")
      expect(projectFirst.description).to.equal("Test Project Description")
      expect(projectFirst.sold).to.equal(false)
      expect(projectFirst.creator).to.equal(addr1.address)
      expect(projectFirst.lastBid).to.equal(toWei(basePrice))
      expect(projectFirst.completed).to.equal(false)

      // Test first nft details
      const nftFirst = await nftprojectmarket.projectNfts(1)
      expect(nftFirst.itemId).to.equal(1)
      expect(nftFirst.nft).to.equal(nft.address)
      expect(nftFirst.tokenId).to.equal(1)
      expect(nftFirst.projectId).to.equal(1)

      // Test first bid details
      const bidFirst = await nftprojectmarket.projectBids(1)
      expect(bidFirst.bidPrice).to.equal(toWei(basePrice))
      expect(bidFirst.bidder).to.equal(addr1.address)
      expect(bidFirst.bidId).to.equal(1)
      expect(bidFirst.projectId).to.equal(1)
    })
  })
})
