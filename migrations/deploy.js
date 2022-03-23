const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const NFTPayment = await ethers.getContractFactory("NFTPayment");
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");

    const NFTCollection = await ethers.getContractFactory("NFTCollection");
    const collection = await NFTCollection.deploy(NFTMarketplace);

 
  
    console.log("Collection address:", collection.address);
    console.log("Payment address:", payment.address);
    console.log("Marketplace address:", marketplace.address);
 
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });