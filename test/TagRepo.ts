import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

import { abi as RecordABI } from "../artifacts/contracts/Record.sol/Record.json" ;
import { abi as TagRepoABI } from "../artifacts/contracts/TagRepo.sol/TagsRepo.json";


const arwaeveBaseUrl = "http://arweave.net/";

const fileTxs = [
  "SIDgyBbwuErZgfnEFzfuNtP-3YvFdLmn8G_BePGCL9s",
  "7lmMbH1XEiIstR_UVWGEfweDM2BrTIQAONupzqzRbA4",
  "SuWae9eWKU8Kv2n58B6XvBt4YD7tVI50VcrPQ0h6FJM",
  "3acmgq4GGzZEsKg6vklI3XLA_KhqDn6ep2deWLdrMQ8" 
]
const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
const ONE_GWEI = 1_000_000_000;

const recordAbiInterface = new ethers.utils.Interface(RecordABI);
const tagRepoAbiInterface = new ethers.utils.Interface(TagRepoABI);

describe("TagRepo Contract", function() {
  async function deployTagRepoFixture() {
    const TagRepo = await ethers.getContractFactory("TagsRepo");
    const tagRepo = await TagRepo.deploy("testseedphrase");
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const tagId = await tagRepo.tagMulti([`${arwaeveBaseUrl}${fileTxs[0]}`, `${arwaeveBaseUrl}${fileTxs[1]}`]);
    const tagIdReciept = await tagId.wait();

    const tagIdLogs = tagIdReciept.logs;
    const parsedTagIdLogs = tagIdLogs.map((x)=>{return tagRepoAbiInterface.parseLog(x);}).filter((x) => {return x.name === 'TagCreated'});

    return { parsedTagIdLogs, tagRepo, owner, otherAccount };
  }
  // describe("Checking Deployment", function() {
  //   it("check if seedPhrase is private.",async function() {
  //     const { parsedTagIdLogs, tagRepo } = await loadFixture(deployTagRepoFixture);
  //     expect(await tagRepo.seedPhrase()).to.equal(unlockTime);
  //   });
  //   it("check if nonce is private.");
  //   it("check if misses is private.");
  // })
  describe("Checking Tagging Process", function() {
    it("check if tagOne works.", async function(){
      const {tagRepo} = await loadFixture(deployTagRepoFixture);
      await expect(tagRepo.tagOne(`${arwaeveBaseUrl}${fileTxs[0]}`)).to.emit(tagRepo,"TagCreated").withArgs(anyValue,`${arwaeveBaseUrl}${fileTxs[0]}`);
    });
    it("check if tagMulti works.", async function(){
      const uriArr = fileTxs.map((x)=>{return `${arwaeveBaseUrl}${x}`});
      const {tagRepo} = await loadFixture(deployTagRepoFixture);
      
      let count = 0;
      while(count < uriArr.length){
        await expect(tagRepo.tagMulti(uriArr)).to.emit(tagRepo,"TagCreated").withArgs(anyValue,`${arwaeveBaseUrl}${fileTxs[count]}`);
        count++;
      }
    });
  })
  describe("Checking Disabled Function", function() {
    it("check if approve is disabled.", async function () {
      const {tagRepo, otherAccount} = await loadFixture(deployTagRepoFixture);

      await expect(tagRepo.approve(otherAccount.address,BigInt(0))).to.be.revertedWith("The invoked function of ERC721 is disable for tagRepos.");
    });
    it("check if getApproved is disabled.", async function(){
      const {tagRepo} = await loadFixture(deployTagRepoFixture);

      await expect(tagRepo.getApproved(BigInt(0))).to.be.revertedWith("The invoked function of ERC721 is disable for tagRepos.");
    });
    it("check if setApprovedForAll is disabled.", async function(){
      const {tagRepo, owner} = await loadFixture(deployTagRepoFixture);

      await expect(tagRepo.setApprovalForAll(owner.address,true)).to.be.revertedWith("The invoked function of ERC721 is disable for tagRepos.");
    }
    );
    it("check if isApprivedForAll is disabled.", async function(){
      const {tagRepo, owner, otherAccount} = await loadFixture(deployTagRepoFixture);

      await expect(tagRepo.isApprovedForAll(owner.address, otherAccount.address)).to.be.revertedWith("The invoked function of ERC721 is disable for tagRepos.");
    });
    it("check if transferFrom is disabled.", async function(){
      const {tagRepo, owner, otherAccount} = await loadFixture(deployTagRepoFixture);

      await expect(tagRepo.transferFrom(owner.address, otherAccount.address,BigInt(0))).to.be.revertedWith("The invoked function of ERC721 is disable for tagRepos.");
    });
    it("check if safeTransferFrom_2 is disabled.", async function () {
      const {tagRepo, owner, otherAccount} = await loadFixture(deployTagRepoFixture);

      await expect(tagRepo["safeTransferFrom(address,address,uint256)"](owner.address, otherAccount.address,BigInt(0))).to.be.revertedWith("The invoked function of ERC721 is disable for tagRepos.");
    });
    it("check if safeTransferFrom_3 is disabled.",async function () {
      const {tagRepo, owner, otherAccount} = await loadFixture(deployTagRepoFixture);

      await expect(tagRepo["safeTransferFrom(address,address,uint256,bytes)"](owner.address, otherAccount.address,BigInt(0),"0x00")).to.be.revertedWith("The invoked function of ERC721 is disable for tagRepos.");
    });
  })
})
