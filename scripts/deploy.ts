import { ethers } from "hardhat";

async function main() {
   const currentTimestampInSeconds = Math.round(Date.now() / 1000);
   const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
   const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

  // const lockedAmount = ethers.utils.parseEther("1");

  // const Lock = await ethers.getContractFactory("Lock");
  // const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

  // await lock.deployed();

  const TagsRepo = await ethers.getContractFactory("TagsRepo");
  const tagsRepo = await TagsRepo.deploy("originalSeed");

  const Record = await ethers.getContractFactory("Record");
  const record = await Record.deploy([],"Record#1","hash",5*60);

  await record;
  console.log(`record is deployed with ${5*60}s to expiry @ ${record.address}`);
  await tagsRepo;
  console.log(`tagRepo is deployed @ ${tagsRepo.address}`);
  // console.log(`Lock with 1 ETH and unlock timestamp ${unlockTime} deployed to ${lock.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
