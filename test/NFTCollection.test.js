const { expectRevert } = require('@openzeppelin/test-helpers');


const NFTCollection = artifacts.require('./NFTCollection.sol');

contract('NFTCollection', (accounts) => {
  let contract;
  let nftOwner; // The original owner of the asset e.g. the Artist
  let feeReceiver; // The marketplace provider

  before(async () => {
      feeReceiver = accounts[0];
      nftOwner = accounts[1];
      // royalties 5% to Owner and 2% to platform provider
      const ownerShare = 5;
      const platformShare = 2;
      const ownerShareSplit = (ownerShare / (ownerShare + platformShare) * 100);
      const platformShareSplit = (ownerShare / (ownerShare + platformShare) * 100);

      contract = await NFTCollection.new(nftOwner);
  });

  describe('deployment', () => {
    it('deploys successfully', async () => {
      const address = contract.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, '');
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });

    it('has a name', async() => {
      const name = await contract.name();
      assert.equal(name, 'mTC Collection');
    });

    it('has a symbol', async() => {
      const symbol = await contract.symbol();
      assert.equal(symbol, 'mTC');
    });
  });

  describe('minting', () => {
    it('creates a new token', async () => {
      const result = await contract.safeMint('testURI');
      const totalSupply = await contract.totalSupply();

      // SUCCESS
      assert.equal(totalSupply, 1);
      const event = result.logs[0].args;
      assert.equal(event.tokenId.toNumber(), 1, 'id is correct');
      assert.equal(event.from, '0x0000000000000000000000000000000000000000', 'from is correct');
      assert.equal(event.to, accounts[0], 'to is correct')

      // FAILURE: cannot mint same color twice
      await expectRevert(contract.safeMint('testURI'), 'The token URI should be unique');
    });

    it('token URI is correctly assigned', async() => {
      // SUCCESS
      const tokenURI = await contract.tokenURI(1);
      assert.equal(tokenURI, 'testURI');

      // FAILURE
      await expectRevert(contract.tokenURI(2), 'ERC721Metadata: URI query for nonexistent token');
    });

    
  });
  describe('royalties', () => {
    it('royalties percentage', async() => {
      const royaltiesPercentage = await contract.royaltiesPercentage()
      assert.equal(royaltiesPercentage.toNumber(), 7)
    });
    
    it('royalties is assigned', async() => {

 
      const royaltiesPercentage = await contract.royaltiesPercentage()
      const price = 1
      const expectedRoyalties = (price * royaltiesPercentage.toNumber()) / 100
      const info = await contract.royaltyInfo(price * 100)
      assert.equal(info.royaltyAmount.toNumber() / 100, expectedRoyalties)

    });
  });
});