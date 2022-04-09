const { expectRevert } = require('@openzeppelin/test-helpers');
const { assertion } = require('@openzeppelin/test-helpers/src/expectRevert');

const NFTCollection = artifacts.require('./NFTCollection.sol');
const NFTMarketplace = artifacts.require('./NFTMarketplace.sol');

const marketplaceFee = 2;
const copyrightFee = 5;
const offerPrice = 1000;
const offerPriceWei = web3.utils.toWei(offerPrice.toString(), 'ether');

contract('NFTMarketplace', (accounts) => {

  let nftContract;
  let mktContract;
  let paymentContract;
  let nftOwner; // The original owner of the asset e.g. the Artist
  let feeReceiver; // The marketplace provider
  let NFTaddress;

  before(async () => {
    nftOwner = accounts[0];
    feeReceiver = accounts[1];
    nftBuyer1 = accounts[2];
    nftBuyer2 = accounts[3];

    nftContract = await NFTCollection.new();

    NFTaddress = nftContract.address;


    marketplaceShare =  web3.utils.toWei(((marketplaceFee / (marketplaceFee + copyrightFee)) * 100).toFixed(18).toString(), 'ether');
    copyrightShare =  web3.utils.toWei(((copyrightFee / (marketplaceFee + copyrightFee)) * 100).toFixed(18).toString(), 'ether');
  
    // paymentContract = await NFTPayment.new([feeReceiver, nftOwner],[marketplaceShare, copyrightShare]);
    mktContract = await NFTMarketplace.new(NFTaddress);

    await nftContract.safeMint('testURI', web3.utils.toWei(copyrightFee.toString()), feeReceiver, web3.utils.toWei(marketplaceFee.toString()));
    await nftContract.safeMint('testURI2', web3.utils.toWei(copyrightFee.toString()), feeReceiver, web3.utils.toWei(marketplaceFee.toString()));
    await nftContract.safeMint('testURI3', web3.utils.toWei(copyrightFee.toString()), feeReceiver, web3.utils.toWei(marketplaceFee.toString()));

  });

  describe('Make Offer', () => {

    it('Requires the approval from the user', async () => {
      await expectRevert(mktContract.makeOffer(1, offerPriceWei), 'ERC721: transfer caller is not owner nor approved');
    });

    before(async() => {
      await nftContract.approve(mktContract.address, 2);
      await mktContract.makeOffer(2, offerPriceWei);      
    })

    it('Transfers the ownership to this contract', async() => {
      const owner = await nftContract.ownerOf(2);
      assert.equal(owner, mktContract.address);
    });

    it('Creates an offer', async() => {
      const offer = await mktContract.offers(1);
      assert.equal(offer.offerId.toNumber(), 1);
      assert.equal(offer.id.toNumber(), 2);
      assert.equal(offer.user, nftOwner);
      assert.equal(web3.utils.fromWei(offer.price), offerPrice);
      assert.equal(offer.fulfilled, false);
      assert.equal(offer.cancelled, false);
    });

    it('Emits an Event Offer', async() => {
      await nftContract.approve(mktContract.address, 1);
      const result = await mktContract.makeOffer(1, offerPriceWei);
      const log = result.logs[0];
      assert.equal(log.event, 'Offer');
      const event = log.args;
      assert.equal(event.offerId.toNumber(), 2);
      assert.equal(event.id.toNumber(), 1);
      assert.equal(event.user, nftOwner);
      assert.equal(web3.utils.fromWei(event.price), web3.utils.fromWei(offerPriceWei));
      assert.equal(event.fulfilled, false);
      assert.equal(event.cancelled, false);
    });
  });

  describe('Fill Offer', () => {

    it('fills the offer and emits Event', async() => {
      const price = offerPriceWei;
      const result = await mktContract.fillOffer(1, { from: nftBuyer1, value: price });
      const offer = await mktContract.offers(1);

      assert.equal(offer.fulfilled, true);
      const userFunds = await mktContract.userFunds(offer.user);
  

      assert.equal(web3.utils.fromWei(userFunds), web3.utils.fromWei(offerPriceWei) - 70);

      const log = result.logs[0];
      assert.equal(log.event, 'OfferFilled');
      const event = log.args;
      assert.equal(event.offerId.toNumber(), 1);

    });
    
    it('The offer must exist', async() => {
      await expectRevert(mktContract.fillOffer(3, { from: nftOwner}), 'The offer must exist');
    });

    it('The owner cannot fill it', async() => {
      await expectRevert(mktContract.fillOffer(2, { from: nftOwner }), 'The owner of the offer cannot fill it');
    });

    it('Cannot be fulfilled twice', async() => {
      await expectRevert(mktContract.fillOffer(1, { from: nftBuyer1 }), 'An offer cannot be fulfilled twice');
    });

    it('A fulfilled order cannot be cancelled', async() => {
      await expectRevert(mktContract.cancelOffer(1, { from: nftOwner }), 'A fulfilled offer cannot be cancelled');
    });

    it('The ETH sent should match the price', async() => {
      await expectRevert(mktContract.fillOffer(2, { from: nftBuyer1, value: 5 }), 'The ETH amount should match with the NFT Price');
    });
  });

  describe('Cancel Offer', () => {

    it('Only the owner can cancel', async() => {
      await expectRevert(mktContract.cancelOffer(2, { from: nftBuyer1 }), 'The offer can only be canceled by the owner');
    });
    
    it('Cancels the offer and emits Event', async() => {
      const result = await mktContract.cancelOffer(2, { from: nftOwner });
      const offer = await mktContract.offers(2);
      assert.equal(offer.cancelled, true);

      const log = result.logs[0];
      assert.equal(log.event, 'OfferCancelled');
      const event = log.args;
      assert.equal(event.offerId.toNumber(), 2);
    });
    
    it('The offer must exist', async() => {
      await expectRevert(mktContract.cancelOffer(3, { from: nftOwner }), 'The offer must exist');
    });    

    it('Cannot be cancelled twice', async() => {
      await expectRevert(mktContract.cancelOffer(2, { from: nftOwner }), 'An offer cannot be cancelled twice');
    });

    it('A cancelled offer cannot be fulfilled', async() => {
      await expectRevert(mktContract.fillOffer(2, { from: nftBuyer1 }), 'A cancelled offer cannot be fulfilled');
    });
  });
  describe('Split payment fee', () => { 

       before(async() => {
            await mktContract.claimFunds();
       }); 

       it('Release to the Fee Receiver', async() => {
             const result = await mktContract.claimServiceFunds({from: feeReceiver});
             const log = result.logs[0];
             assert.equal(log.event, 'ClaimFunds');
             const event = log.args;
             assert.equal(web3.utils.fromWei(event.amount), 20);
       });

       it('Release to the Owner', async() => {
         
              const result = await mktContract.claimRoyaltyFunds({from: nftOwner});
              const log = result.logs[0];
              assert.equal(log.event, 'ClaimFunds');
              const event = log.args;
              assert.equal(web3.utils.fromWei(event.amount), 50);
       });

       it('Release to the Seller', async() => {
              await expectRevert(mktContract.claimFunds({from: nftBuyer1}), 'This user has no funds to be claimed');
       });

   });
   describe('NFT Buyer 1 sell to Buyer 2', () => {  

       before( async() => {

            const copyrightOwner = await nftContract.getCopyrightOwner(1);
            const copyrightFee = await nftContract.getCopyrightOwnerFee(1);
            const serviceFee = await nftContract.getMarketplaceFee(1);
            const receiveAble= 100 - (web3.utils.fromWei(serviceFee) + web3.utils.fromWei(copyrightFee));
            mktContract = await NFTMarketplace.new(NFTaddress);
            await nftContract.approve(mktContract.address, 1);
            const result = await mktContract.makeOffer(1, offerPriceWei);

            await mktContract.fillOffer(1, { from: nftBuyer2, value: offerPriceWei });
            await mktContract.offers(1);
         
       });

       it('Release to the Fee Receiver', async() => {
            const result = await mktContract.claimServiceFunds({from: feeReceiver});
            const log = result.logs[0];
            assert.equal(log.event, 'ClaimFunds');
            const event = log.args;
            assert.equal(web3.utils.fromWei(event.amount), 20);
       });
       
       it('Release royalty to the Copyright Owner', async() => {
              const copyrightOwner = await nftContract.getCopyrightOwner(1);
              const result = await mktContract.claimRoyaltyFunds({from: copyrightOwner});
              const log = result.logs[0];
              assert.equal(log.event, 'ClaimFunds');
              const event = log.args;
              assert.equal(web3.utils.fromWei(event.amount), 50);
       });
               
       it('Release balance to the Seller', async() => {
              const result = await mktContract.claimFunds();
              const log = result.logs[0];
              assert.equal(log.event, 'ClaimFunds');
              const event = log.args;
              assert.equal(web3.utils.fromWei(event.amount), 930);
       });


   });
   

});