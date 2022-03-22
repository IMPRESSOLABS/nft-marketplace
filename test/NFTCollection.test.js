const { expectRevert } = require('@openzeppelin/test-helpers');


const NFTCollection = artifacts.require('./NFTCollection.sol');

contract('NFTCollection', (accounts) => {
  let contract;

  before(async () => {
      contract = await NFTCollection.new();
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
      const result = await contract.safeMint('testURI', 5);
      const totalSupply = await contract.totalSupply();

      // SUCCESS
      assert.equal(totalSupply, 1);
      const event = result.logs[0].args;
      assert.equal(event.tokenId.toNumber(), 1, 'id is correct');
      assert.equal(event.from, '0x0000000000000000000000000000000000000000', 'from is correct');
      assert.equal(event.to, accounts[0], 'to is correct')

      // FAILURE: cannot mint same color twice
      await expectRevert(contract.safeMint('testURI', 5), 'The token URI should be unique');
    });

    it('token URI is correctly assigned', async() => {
      // SUCCESS
      const tokenURI = await contract.tokenURI(1);
      assert.equal(tokenURI, 'testURI');

      // FAILURE
      await expectRevert(contract.tokenURI(2), 'ERC721Metadata: URI query for nonexistent token');
    });

    it('token assign to correct copyright ownership', async() => { 
      // SUCCESS
      const owner = await contract.copyrightOwnership(1);
      assert.equal(owner, accounts[0]);

    });

    it('token assign to correct copyright ownership fee charge', async() => { 
      // SUCCESS
      const fee = await contract.copyrightFee(1);
      assert.equal(5, fee.toNumber());

    });

    it('token assign to correct provider service charge', async() => { 
      // SUCCESS
      const fee = await contract.serviceFee();
      assert.equal(2, fee.toNumber());

    });

    
  });

});