// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC2981.sol";

contract NFTCollection is Ownable, ERC721, ERC721Enumerable{
  string[] public tokenURIs;
  uint8 public decimals = 18;
  mapping(string => bool) _tokenURIExists;
  mapping(uint => string) _tokenIdToTokenURI;
  // Address of the royalties recipient
  address private _royaltiesReceiver;
  // Percentage of each sale to pay as royalties (5% to Owner; 2% to platform provider)
  uint256 public constant royaltiesPercentage = 7; 

  constructor(address initialRoyaltiesReceiver) 
    ERC721("mTC Collection", "mTC") 
  {
     _royaltiesReceiver = initialRoyaltiesReceiver;
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
      return interfaceId == type(IERC2981).interfaceId ||
      super.supportsInterface(interfaceId);
  }

  function tokenURI(uint256 tokenId) public override view returns (string memory) {
    require(_exists(tokenId), 'ERC721Metadata: URI query for nonexistent token');
    return _tokenIdToTokenURI[tokenId];
  }

  function safeMint(string memory _tokenURI) public {
    require(!_tokenURIExists[_tokenURI], 'The token URI should be unique');
    tokenURIs.push(_tokenURI);    
    uint _id = tokenURIs.length;
    _tokenIdToTokenURI[_id] = _tokenURI;
    _safeMint(msg.sender, _id);
    _tokenURIExists[_tokenURI] = true;
  }

  function _burn(uint256 tokenId) internal override(ERC721) {
      super._burn(tokenId);
  }

  /// @notice Getter function for _royaltiesReceiver
  /// @return the address of the royalties recipient
  function royaltiesReceiver() external returns(address) {
      return _royaltiesReceiver;
  }

  /// @notice Changes the royalties' recipient address (in case rights are
  ///         transferred for instance)
  /// @param newRoyaltiesReceiver - address of the new royalties recipient
  function setRoyaltiesReceiver(address newRoyaltiesReceiver)
  external onlyOwner {
      require(newRoyaltiesReceiver != _royaltiesReceiver); // dev: Same address
      _royaltiesReceiver = newRoyaltiesReceiver;
  }

  function royaltyInfo(uint256 _salePrice) external view returns (address receiver, uint256 royaltyAmount) {
        uint256 _royalties = (_salePrice * royaltiesPercentage) / 100;

        return (_royaltiesReceiver, _royalties);
  }



}