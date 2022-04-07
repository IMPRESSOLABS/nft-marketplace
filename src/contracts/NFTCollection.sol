// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract NFTCollection is Ownable, ERC721, ERC721Enumerable {

  string[] public tokenURIs;
  uint8 public decimals = 18;

  mapping(string => bool) _tokenURIExists;
  mapping(uint => string) _tokenIdToTokenURI;
  mapping(uint => address) _copyrightOwners;
  mapping(uint => address) _marketplaces;
  mapping(uint => uint256) _copyrightOwnerFees;
  mapping(uint => uint256) _marketplaceFees;

  constructor() 
    ERC721("mTC Collection", "mTC")
  {

  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721, ERC721Enumerable) {
      super._beforeTokenTransfer(from, to, tokenId);
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {

      return  super.supportsInterface(interfaceId);
  }

  function tokenURI(uint256 tokenId) public override view returns (string memory) {
      require(_exists(tokenId), 'ERC721Metadata: URI query for nonexistent token');
      return _tokenIdToTokenURI[tokenId];
  }

  function safeMint(string memory _tokenURI, uint256 _fee, address _marketplace, uint256 _marketplaceFee) public {
      require(!_tokenURIExists[_tokenURI], 'The token URI should be unique');
      tokenURIs.push(_tokenURI);    
      uint _id = tokenURIs.length;
      _copyrightOwners[_id] = msg.sender;
      _marketplaces[_id] = _marketplace;
      _copyrightOwnerFees[_id] = _fee;
      _marketplaceFees[_id] = _marketplaceFee;
      _tokenIdToTokenURI[_id] = _tokenURI;
      _safeMint(msg.sender, _id);
      _tokenURIExists[_tokenURI] = true;
  }

  function _burn(uint tokenId) internal override(ERC721) {
      super._burn(tokenId);
  }

  function getCopyrightOwner(uint tokenId) view external returns(address) {
      return _copyrightOwners[tokenId];
  }

  function getCopyrightOwnerFee(uint tokenId) view external returns(uint256) {
      return _copyrightOwnerFees[tokenId];
  }


  function getMarketplace(uint tokenId) view external returns(address) {
      return _marketplaces[tokenId];
  }    
  

  function getMarketplaceFee(uint tokenId) view external returns(uint256) {
      return _marketplaceFees[tokenId];
  }



}