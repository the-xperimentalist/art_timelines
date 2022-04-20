// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * The NFTProject contract keeps a note of the list of all nfts
 * The given contract is specifically for the project creation with timelines
 */
contract NFTProjectMarketplace is ReentrancyGuard {
  address payable public immutable feeAccount;
  uint public feePercent;
  bool public completed = false;
  uint256 public sellTimeDelay;

  struct Bid {
    uint256 bidTime;
    uint bidPrice;
    address bidder;
    uint bidId;
  }

  event NewBid (
    uint256 indexed bidTime,
    uint bidPrice,
    address indexed bidder,
    uint bidId,
    uint projectId
  );

  event BidConverted (
    uint256 indexed convertTime,
    uint finalPrice,
    address indexed buyer,
    uint projectId,
    address indexed seller
  );

  struct NFTItem {
    uint itemId;
    IERC721 nft;
    uint tokenId;
    uint256 uploadTime;
  }

  event NFTAdded (
    uint itemId,
    address indexed nft,
    uint tokenId,
    uint256 uploadTime,
    address indexed seller,
    uint indexed projectId
  );

  struct Project {
    uint projectId;
    string name;
    string description;
    mapping(uint => NFTItem) nfts;
    uint noOfNfts;
    mapping(uint => Bid) bids;
    uint noOfBids;
    bool sold;
    address payable creator;
    uint lastBid;
    bool completed;
    uint256 projectCompleteTime;
  }
  uint256 public projectCount;
  mapping(uint => Project) public projects;

  event ProjectAdd (
    uint projectId,
    string name,
    string description,
    address payable creator,
    uint lastBid
  );

  event ProjectCompleted (
    uint projectId,
    uint256 timeBeforeFinalBuy
  );

  event ProjectBought (
    uint projectId,
    uint price,
    address indexed seller,
    address indexed buyer
  );

  constructor(uint _feePercent, uint _sellTimeDelay) {
    feePercent = _feePercent;
    feeAccount = payable(msg.sender);
    sellTimeDelay = _sellTimeDelay;
  }

  function getCurrentTimeInEpoch() internal view returns(uint256) {
    return block.timestamp;
  }

  function getTotalPrice(uint _projectId) view public returns(uint) {
    return(projects[_projectId].lastBid * ( 100+feePercent ) / 100);
  }

  /*
   ** The given method is to initialize a project with a given NFT. It instantiates a normal project
   *  with the given NFT, and places an initial bid as decided by the creator
   */
  function makeProject(IERC721 _nft, uint _tokenId, uint _basePrice, string memory _projectName, string memory _projectDescription) external nonReentrant {
    require(_basePrice > 0, "Price must be greater than 0");

    uint256 currentTime = getCurrentTimeInEpoch();

    _nft.transferFrom(msg.sender, address(this), _tokenId);

    // mapping(uint => NFTItem) memory newNft; // Validate the memory vs storage use case here
    // newNft[1] = NFTItem(1, _nft, _tokenId, currentTime);
    // mapping(uint => Bid) memory newBid; // Validate the memory vs storage use case here
    // newBid[1] = Bid(currentTime, _basePrice, msg.sender, 1);

    projectCount ++;

    // Artifically add values to struct to test
    Project storage project = projects[projectCount];
    project.projectId = projectCount;
    project.name = _projectName;
    project.description = _projectDescription;
    project.noOfNfts ++;
    project.noOfBids ++;

    NFTItem memory nftItem = NFTItem(project.noOfNfts, _nft, _tokenId, currentTime);
    Bid memory bid = Bid(currentTime, _basePrice, msg.sender, project.noOfBids);

    project.nfts[project.noOfNfts] = nftItem;
    project.bids[project.noOfBids] = bid;
    project.sold = false;
    project.creator = payable(msg.sender);
    project.lastBid = _basePrice;
    project.completed = false;

    emit NFTAdded(project.noOfNfts, address(_nft), _tokenId, currentTime, msg.sender, projectCount);
    emit NewBid(currentTime, _basePrice, msg.sender, project.noOfBids, projectCount);
    emit ProjectAdd(projectCount, _projectName, _projectDescription, payable(msg.sender), _basePrice);
  }

  /*
   ** Add new timeline NFT to the project
   */
  function addNFTToProject(IERC721 _nft, uint _tokenId, uint _projectId) external nonReentrant {
    Project storage proj = projects[_projectId];
    require(msg.sender == proj.creator, "Only the creator can add nfts to the project");

    uint256 currentTime = getCurrentTimeInEpoch();

    proj.noOfNfts ++;
    proj.nfts[proj.noOfNfts] = NFTItem(proj.noOfNfts, _nft, _tokenId, currentTime);

    emit NFTAdded(proj.noOfNfts, address(_nft), _tokenId, currentTime, msg.sender, _projectId);
  }

   /*
    ** Update bid price for the project
    */
  function addNewBid(uint _bidPrice, uint _projectId) external nonReentrant {
    require(_bidPrice > 0, "Price can not be less than 0");

    Project storage proj = projects[_projectId];
    require(msg.sender != proj.creator, "Only others can add bids for the project");

    uint256 currentTime = getCurrentTimeInEpoch();

    require(_bidPrice > proj.lastBid, "You can only bid higher amount");
    proj.noOfBids ++;
    proj.bids[proj.noOfBids] = Bid(currentTime, _bidPrice, msg.sender, proj.noOfBids);
    proj.lastBid = _bidPrice;

    emit NewBid(currentTime, _bidPrice, msg.sender, proj.noOfBids, _projectId);
  }

  /*
   ** Complete project
   */
  function completeProject(uint _projectId) external nonReentrant {
    Project storage proj = projects[_projectId];
    uint256 currentTime = getCurrentTimeInEpoch();

    proj.completed = true;
    proj.projectCompleteTime = currentTime;

    emit ProjectCompleted (_projectId, sellTimeDelay);
  }

  /*
   ** Purchase NFT Project
   */
  function purchaseNFTProject(uint _projectId) external payable nonReentrant {

    uint _totalPrice = getTotalPrice(_projectId);
    require(msg.value >= _totalPrice, "Not enough currency to buy item");

    Project storage proj = projects[_projectId];
    require(proj.sold, "Project already sold");
    require(!proj.completed, "Project not yet completed");
    require(msg.sender != proj.creator, "The creator can not buy the NFT project");
    proj.creator.transfer(proj.lastBid);
    feeAccount.transfer(_totalPrice - proj.lastBid);

    uint iterationIndex = 1;
    while (iterationIndex <= proj.noOfNfts) {

      NFTItem memory nftItem = proj.nfts[iterationIndex];
      nftItem.nft.transferFrom(address(this), msg.sender, nftItem.tokenId);

      iterationIndex ++;
    }

    emit ProjectBought(_projectId, proj.lastBid, proj.creator, msg.sender);
  }

}
