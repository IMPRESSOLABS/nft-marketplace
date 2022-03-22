const { expectRevert } = require('@openzeppelin/test-helpers');
const { assertion } = require('@openzeppelin/test-helpers/src/expectRevert');

const NFTCollection = artifacts.require('./NFTCollection.sol');
const NFTMarketplace = artifacts.require('./NFTMarketplace.sol');
const NFTPayment = artifacts.require('./NFTPayment.sol');

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

    
    paymentContract = await NFTPayment.new([feeReceiver, nftOwner],[2, 98]);
    mktContract = await NFTMarketplace.new(NFTaddress, paymentContract.address);

    await nftContract.safeMint('testURI');
    await nftContract.safeMint('testURI2');
    await nftContract.safeMint('testURI3');

  });

  describe('Make Offer', () => {

    it('Requires the approval from the user', async () => {
      await expectRevert(mktContract.makeOffer(1, 1000), 'ERC721: transfer caller is not owner nor approved');
    });

    before(async() => {
      await nftContract.approve(mktContract.address, 2);
      await mktContract.makeOffer(2, 1000);      
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
      assert.equal(offer.price.toNumber(), 1000);
      assert.equal(offer.fulfilled, false);
      assert.equal(offer.cancelled, false);
    });

    it('Emits an Event Offer', async() => {
      await nftContract.approve(mktContract.address, 1);
      const result = await mktContract.makeOffer(1, 1000);
      const log = result.logs[0];
      assert.equal(log.event, 'Offer');
      const event = log.args;
      assert.equal(event.offerId.toNumber(), 2);
      assert.equal(event.id.toNumber(), 1);
      assert.equal(event.user, nftOwner);
      assert.equal(event.price.toNumber(), 1000);
      assert.equal(event.fulfilled, false);
      assert.equal(event.cancelled, false);
    });
  });

  describe('Fill Offer', () => {

    it('fills the offer and emits Event', async() => {
      const price = 1000;
      const result = await mktContract.fillOffer(1, { from: nftBuyer1, value: price });
      const offer = await mktContract.offers(1);

      assert.equal(offer.fulfilled, true);
      const userFunds = await mktContract.userFunds(offer.user);
  

      assert.equal(userFunds.toNumber(), 1000);

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
     
             
             const result = await paymentContract.release(feeReceiver);
             const log = result.logs[0];
             assert.equal(log.event, 'PaymentReleased');
             const event = log.args;
             assert.equal(event.amount.toNumber(), 20);
       });

       it('Release to the Owner', async() => {
         
              const result = await paymentContract.release(nftOwner);
              const log = result.logs[0];
              assert.equal(log.event, 'PaymentReleased');
              const event = log.args;
              assert.equal(event.amount.toNumber(), 980);
       });

       it('Release to the Seller', async() => {
              await expectRevert(paymentContract.release(nftBuyer1), 'PaymentSplitter: account has no shares');
       });

   });
   describe('NFT Buyer 1 sell to Buyer 2', () => {  

       before( async() => {
            paymentContract = await NFTPayment.new([feeReceiver, nftOwner, nftBuyer1],[2, 5, 93]);
            mktContract = await NFTMarketplace.new(NFTaddress, paymentContract.address);

            await nftContract.approve(mktContract.address, 1);
            const result = await mktContract.makeOffer(1, 10000);

            await mktContract.fillOffer(1, { from: nftBuyer2, value: 10000 });
            await mktContract.offers(1);
            await mktContract.claimFunds();
       });

       it('Release to the Fee Receiver', async() => {
            const result = await paymentContract.release(feeReceiver);
            const log = result.logs[0];
            assert.equal(log.event, 'PaymentReleased');
            const event = log.args;
            assert.equal(event.amount.toNumber(), 200);
       });
       
       it('Release to the Copyright Owner', async() => {
              const result = await paymentContract.release(nftOwner);
              const log = result.logs[0];
              assert.equal(log.event, 'PaymentReleased');
              const event = log.args;
              assert.equal(event.amount.toNumber(), 500);
       });
               
       it('Release to the Copyright Seller', async() => {
              const result = await paymentContract.release(nftBuyer1);
              const log = result.logs[0];
              assert.equal(log.event, 'PaymentReleased');
              const event = log.args;
              assert.equal(event.amount.toNumber(), 9300);
       });


   });
   

});