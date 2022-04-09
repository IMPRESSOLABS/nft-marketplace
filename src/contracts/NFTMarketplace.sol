// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./NFTCollection.sol";


contract NFTMarketplace {
  
  bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;
  address public _tokenContractAddress = address(0);
  address payable public payments;
  uint public offerCount;
  mapping (uint => _Offer) public offers;
  mapping (address => uint) public userFunds;
  mapping (address => uint) public royaltyFunds;
  mapping (address => uint) public serviceFunds;
  
  NFTCollection nftCollection;
  
  struct _Offer {
    uint offerId;
    uint id;
    address user;
    uint256 price;
    bool fulfilled;
    bool cancelled;
  }

  event Offer(
    uint offerId,
    uint id,
    address user,
    uint256 price,
    bool fulfilled,
    bool cancelled
  );

  event OfferFilled(uint offerId, uint id, address newOwner);
  event OfferCancelled(uint offerId, uint id, address owner);
  event ClaimFunds(address user, uint256 amount);

  constructor(address _nftCollection) {
        _tokenContractAddress = _nftCollection;
        nftCollection = NFTCollection(_nftCollection);
  }
  
  function makeOffer(uint _id, uint256 _price) public {
    nftCollection.transferFrom(msg.sender, address(this), _id);
    offerCount ++;
    offers[offerCount] = _Offer(offerCount, _id, msg.sender, _price, false, false);
    emit Offer(offerCount, _id, msg.sender, _price, false, false);
  }

  function fillOffer(uint _offerId) public payable {
    _Offer storage _offer = offers[_offerId];
    require(_offer.offerId == _offerId, 'The offer must exist');
    require(_offer.user != msg.sender, 'The owner of the offer cannot fill it');
    require(!_offer.fulfilled, 'An offer cannot be fulfilled twice');
    require(!_offer.cancelled, 'A cancelled offer cannot be fulfilled');
    require(msg.value == _offer.price, 'The ETH amount should match with the NFT Price');
    nftCollection.transferFrom(address(this), msg.sender, _offer.id);
    _offer.fulfilled = true;

    uint tokenId =_offer.id;
    address copyrightOwner = nftCollection.getCopyrightOwner(tokenId);
    address marketplaceAccount = nftCollection.getMarketplace(tokenId);  
    uint256 copyrightOwnerFee = nftCollection.getCopyrightOwnerFee(tokenId);
    uint256 marketplaceFee = nftCollection.getMarketplaceFee(tokenId);  
    
    uint256 saleValue = msg.value;
    uint256 royaltyFeeAmount = (saleValue * (copyrightOwnerFee)) / (100 * 10**18);
    uint256 serviceFeeAmount = (saleValue * (marketplaceFee)) / (100 * 10**18);
    uint256 netSaleValue = saleValue - (royaltyFeeAmount + serviceFeeAmount);
  
    userFunds[_offer.user] += netSaleValue;
    royaltyFunds[copyrightOwner] += royaltyFeeAmount;
    serviceFunds[marketplaceAccount] += serviceFeeAmount;

    emit OfferFilled(_offerId, _offer.id, msg.sender);
  }

  function cancelOffer(uint _offerId) public {
    _Offer storage _offer = offers[_offerId];
    require(_offer.offerId == _offerId, 'The offer must exist');
    require(_offer.user == msg.sender, 'The offer can only be canceled by the owner');
    require(_offer.fulfilled == false, 'A fulfilled offer cannot be cancelled');
    require(_offer.cancelled == false, 'An offer cannot be cancelled twice');
    nftCollection.transferFrom(address(this), msg.sender, _offer.id);
    _offer.cancelled = true;
    emit OfferCancelled(_offerId, _offer.id, msg.sender);
  }


  function claimFunds() public {
    require(userFunds[msg.sender] > 0, 'This user has no funds to be claimed');
    payable(msg.sender).transfer(userFunds[msg.sender]);
    emit ClaimFunds(msg.sender, userFunds[msg.sender]);
    userFunds[msg.sender] = 0;    
  } 

  function claimRoyaltyFunds() public {
    require(royaltyFunds[msg.sender] > 0, 'This user has no royalties to be claimed');
    payable(msg.sender).transfer(royaltyFunds[msg.sender]);
    emit ClaimFunds(msg.sender, royaltyFunds[msg.sender]);
    royaltyFunds[msg.sender] = 0;    
  } 

  function claimServiceFunds() public {
    require(serviceFunds[msg.sender] > 0, 'This user has no service fees to be claimed');
    emit ClaimFunds(msg.sender, serviceFunds[msg.sender]);
    serviceFunds[msg.sender] = 0;    
  } 

  // Fallback: reverts if Ether is sent to this smart-contract by mistake
  fallback () external {
    revert();
  }




}