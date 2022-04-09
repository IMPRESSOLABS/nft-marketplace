hre = require("hardhat");

async function main() {
    const NFTCollection = await hre.ethers.getContractFactory('NFTCollection');
    const NFTMarketplace = await hre.ethers.getContractFactory('NFTMarketplace');
    
    const nftCollection =  await NFTCollection.deploy();
    await nftCollection.deployed();

    const nftMarketplace =  await NFTMarketplace.deploy(nftCollection.address);;
    await nftMarketplace.deployed();

    console.log("Collection deployed at:", nftCollection.address);
    console.log("Marketplace deployed at:", nftMarketplace.address);
}

main().then(() => {
    process.exit(0);
}).catch((error) => {
    console.log(error);
    process.exit(1)
});