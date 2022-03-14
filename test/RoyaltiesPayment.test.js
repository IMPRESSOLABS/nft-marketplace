const { expectRevert } = require('@openzeppelin/test-helpers');
const { assertion } = require('@openzeppelin/test-helpers/src/expectRevert');


const NFTCollection = artifacts.require('./NFTCollection.sol');
const NFTMarketplace = artifacts.require('./NFTMarketplace.sol');
const RoyaltiesPayment = artifacts.require('./RoyaltiesPayment.sol');


contract('RoyaltiesPayment', (accounts) => {
    let nftContract;
    let mktContract;
    let nftOwner; // The original owner of the asset e.g. the Artist
    let feeReceiver; // The marketplace provider
    let alice;
    let bob;
    let charlie;
    let splitter;
  
    before(async () => {
      provider = accounts[0];
      nftOwner = accounts[1];
      alice = accounts[2];
      bob = accounts[3];
      charlie = accounts[4];
  
      nftContract = await NFTCollection.new(nftOwner);
  
      const NFTaddress = nftContract.address;
      mktContract = await NFTMarketplace.new(NFTaddress);
  
      await nftContract.safeMint('testURI1');



      // await mktContract.fillOffer(1, { from: alice, value: 10 });
      // await mktContract.offers(1);
      splitter = await RoyaltiesPayment.new([provider], {"from": nftOwner});



    });
  
  describe('Royalties Payee', () => {
    it('add payees ', async() => { 
  
        await splitter.addPayee(bob, {"from": nftOwner})
        const payee = await splitter.payees(1);
        assert.equal(bob, payee, 'to is correct')
    });
    it('add payees by non-owner', async() => { 
        await expectRevert(splitter.addPayee(charlie, {"from": alice}), 'Ownable: caller is not the owner');
    });
    it('already payee ', async() => { 
         await expectRevert(splitter.addPayee(bob, {"from": nftOwner}), 'Not a payee');
    });
  });

  describe('Royalties Payout', () => {

/*
offer = makeOffer
buy = fillOffer
cancel = cancelOffer
*/

    before(async() => {

   


    })

    it('pay all ', async() => { 
          let beforeBalance = await web3.eth.getBalance(nftOwner)
          
          
          const price = web3.utils.toWei('1000', 'ether');
          await nftContract.approve(mktContract.address, 1);
          await mktContract.makeOffer(1, price);      
          await mktContract.fillOffer(1, { from: charlie, value: price});
          await splitter.payAll({"from": nftOwner})
          await mktContract.claimFunds();
    

    
          const charliePrice = web3.utils.toWei('2000', 'ether');
          const expected_royalties = (charliePrice * await nftContract.royaltiesPercentage()) / 100 

          await nftContract.approve(mktContract.address, 1, {"from": charlie} );
          await mktContract.makeOffer(1, charliePrice, {"from": charlie} );
          await mktContract.fillOffer(2, { from: bob, value: charliePrice});
          await splitter.payAll({"from": nftOwner})
          await mktContract.claimFunds({"from": charlie});

   
          let balance = await web3.eth.getBalance(nftOwner)
          
          console.log(web3.utils.fromWei(balance, 'ether') + ' ' + web3.utils.fromWei(beforeBalance, 'ether'))
          
    })

  });

});