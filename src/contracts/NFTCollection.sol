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
  // Address of the royalties recipient
  address private _copyrightOwner;
  uint256 public constant ownerPercentage = 5; 
  uint256 public constant copyrightOwnerPercentage = 5; 
  uint256 public constant serviceChargePercentage = 2; 

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

  function safeMint(string memory _tokenURI) public {
      require(!_tokenURIExists[_tokenURI], 'The token URI should be unique');
      tokenURIs.push(_tokenURI);    
      _copyrightOwner = msg.sender;
      uint _id = tokenURIs.length;
      _tokenIdToTokenURI[_id] = _tokenURI;
      _safeMint(msg.sender, _id);
      _tokenURIExists[_tokenURI] = true;
  }

  function _burn(uint256 tokenId) internal override(ERC721) {
      super._burn(tokenId);
  }

  function copyrightOwner() view external returns(address) {
      return _copyrightOwner;
  }




}