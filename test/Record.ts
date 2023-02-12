import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
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


describe( "Record Contract", function() {

  async function deployRecordFixture() {
    // Contracts are deployed using the first signer/account by default
    const unlockTime = (await time.latest()) + 60;
    const [owner, otherAccount] = await ethers.getSigners();
    const TagRepo = await ethers.getContractFactory("TagsRepo");
    const tagRepo = await TagRepo.deploy("testseedphrase");
    
    const tagId = await tagRepo.tagMulti([`${arwaeveBaseUrl}${fileTxs[0]}`, `${arwaeveBaseUrl}${fileTxs[1]}`]);
    const tagIdReciept = await tagId.wait();
    // const filter = tagRepo.filters["TagCreated(uint256,string)"](null,null);
    const tagIdLogs = tagIdReciept.logs;
    const parsedTagIdLogs = tagIdLogs.map((x)=>{return tagRepoAbiInterface.parseLog(x);}).filter((x) => {return x.name === 'TagCreated'});

    const Record = await ethers.getContractFactory("Record");
    const parentRecord = await Record.deploy([],"parentRecords", "IMG", BigInt(0));
    const record = await Record.deploy([parentRecord.address],"Records", "IMG",BigInt(unlockTime));
    return {parsedTagIdLogs, tagRepo, parentRecord, record, owner, otherAccount, unlockTime };
  }

  describe("Checking Deployment", function() {
    it("check if expiryDatetimeDuration is public and correct.", async function(){
      const { record, unlockTime } = await loadFixture(deployRecordFixture);
      expect(await record.immutableFrom()).to.equal(unlockTime);
    });
    it("check if recordChainLength is public and correct.", async function(){
      const { record } = await loadFixture(deployRecordFixture);
      expect(await record.recordChainLength()).to.equal(BigInt(1));
    });
    it("check if recordParentRecord is public and correct.", async function(){
      const { record, parentRecord } = await loadFixture(deployRecordFixture);
      expect(await record.recordParentRecords(0)).to.equal(parentRecord.address);
    });
  })

  describe("Checking Tag Tracing Process", function() {
    describe("check if traceOneTag function works proper.", function() {
      it("check if function is not accessable when immutable", async function() {
        const { parsedTagIdLogs, tagRepo , parentRecord } = await loadFixture(deployRecordFixture);
        
        await expect(parentRecord.traceOneTag(tagRepo.address,parsedTagIdLogs[0].args.tagId)).to.be.revertedWith(`called function is only usable during building period.`);
      });
      it("check if function is accessable during building phase and data of Traced Tag is accessable.", async function() {
        const { parsedTagIdLogs, tagRepo , record } = await loadFixture(deployRecordFixture);

        const traceOneTagOrder = await record.traceOneTag(tagRepo.address,parsedTagIdLogs[0].args.tagId);
        const traceOneTagReciept = await traceOneTagOrder.wait();
        const traceOneTagLogs = traceOneTagReciept.logs;
        const parsedTraceOneTagLogs = traceOneTagLogs.map((x)=>{return recordAbiInterface.parseLog(x)}).filter((x)=>{return x.name === "TagTraced"});

        expect(parsedTagIdLogs[0].args.tagId).to.be.equal(parsedTraceOneTagLogs[0].args.tagId);
        expect(tagRepo.address).to.be.equal(parsedTraceOneTagLogs[0].args.tagRepoAddress);
      });
    });
    describe("check if traceMultiTags function works proper.", function() {
      it("check if function is not accessable when immutable", async function(){
        const { parsedTagIdLogs, tagRepo , parentRecord } = await loadFixture(deployRecordFixture);
        
        await expect(parentRecord.traceMultiTags(tagRepo.address,[parsedTagIdLogs[0].args.tagId, parsedTagIdLogs[1].args.tagId])).to.be.revertedWith(`called function is only usable during building period.`);
      });
      it("check if function is accessable during building phase and data of Traced Tags is accessable.", async function() {
        const { parsedTagIdLogs, tagRepo , record } = await loadFixture(deployRecordFixture);

        const traceMultiTagsOrder = await record.traceMultiTags(tagRepo.address,[parsedTagIdLogs[0].args.tagId, parsedTagIdLogs[1].args.tagId]);
        const traceMultiTagsReciept = await traceMultiTagsOrder.wait();
        const traceMultiTagsLogs = traceMultiTagsReciept.logs;
        const parsedTraceMultiTagsLogs = traceMultiTagsLogs.map((x)=>{return recordAbiInterface.parseLog(x)}).filter((x)=>{return x.name === "TagTraced"});

        let i = 0;
        while(i < parsedTraceMultiTagsLogs.length){
          expect(parsedTagIdLogs[i].args.tagId).to.be.equal(parsedTraceMultiTagsLogs[i].args.tagId);
          expect(tagRepo.address).to.be.equal(parsedTraceMultiTagsLogs[i].args.tagRepoAddress);
          i++;
        }
      });
    });
  })
  describe("Checking Tag Signing Process", function() {
    describe("check if sign function works proper.", function() {
      it("check if function is not accessable during building phase.", async function(){
        const { record } = await loadFixture(deployRecordFixture);

        await expect(record.sign()).to.be.revertedWith(`called function is only available when contract is immutable.`);
      });
      it("check if function is accessable when immutable", async function(){
        const { owner, parentRecord } = await loadFixture(deployRecordFixture);

        await expect(parentRecord.sign()).to.emit(parentRecord,"RecordSigned").withArgs(owner.address);
      });
    });
    describe("check if hasSigned function works proper.", function() {
      it("check if function is not accessable during building phase.", async function(){
        const { owner, record } = await loadFixture(deployRecordFixture);

        await expect(record.hasSigned(owner.address)).to.be.revertedWith(`called function is only available when contract is immutable.`);
      });
      it("check if function is accessable when immutable and signature verified.", async function(){
        const { owner, parentRecord } = await loadFixture(deployRecordFixture);
        await parentRecord.sign();
        let signature = await parentRecord.hasSigned(owner.address);
        
        expect(signature).to.be.equal(true);
      });
    });
  })
  describe("Checking Disabled Function", function() {
    it("check if approve is disabled.", async function () {
      const {record, otherAccount} = await loadFixture(deployRecordFixture);

      await expect(record.approve(otherAccount.address,BigInt(0))).to.be.revertedWith("The invoked function of ERC721 is disable for Records.");
    });
    it("check if getApproved is disabled.", async function(){
      const {record} = await loadFixture(deployRecordFixture);

      await expect(record.getApproved(BigInt(0))).to.be.revertedWith("The invoked function of ERC721 is disable for Records.");
    });
    it("check if setApprovedForAll is disabled.", async function(){
      const {record, owner} = await loadFixture(deployRecordFixture);

      await expect(record.setApprovalForAll(owner.address,true)).to.be.revertedWith("The invoked function of ERC721 is disable for Records.");
    }
    );
    it("check if isApprivedForAll is disabled.", async function(){
      const {record, owner, otherAccount} = await loadFixture(deployRecordFixture);

      await expect(record.isApprovedForAll(owner.address, otherAccount.address)).to.be.revertedWith("The invoked function of ERC721 is disable for Records.");
    });
    it("check if transferFrom is disabled.", async function(){
      const {record, owner, otherAccount} = await loadFixture(deployRecordFixture);

      await expect(record.transferFrom(owner.address, otherAccount.address,BigInt(0))).to.be.revertedWith("The invoked function of ERC721 is disable for Records.");
    });
    it("check if safeTransferFrom_2 is disabled.", async function(){
      const {record, owner, otherAccount} = await loadFixture(deployRecordFixture);

      await expect(record["safeTransferFrom(address,address,uint256)"](owner.address, otherAccount.address,BigInt(0))).to.be.revertedWith("The invoked function of ERC721 is disable for Records.");
    });
    it("check if safeTransferFrom_3 is disabled.", async function(){
      const {record, owner, otherAccount} = await loadFixture(deployRecordFixture);
      await expect(record["safeTransferFrom(address,address,uint256,bytes)"](owner.address, otherAccount.address,BigInt(0),"0x00")).to.be.revertedWith("The invoked function of ERC721 is disable for Records.");
    });
  })
})




  // const tagId = await tagRepo.tagMulti([`${arwaeveBaseUrl}${fileTxs[0]}`, `${arwaeveBaseUrl}${fileTxs[1]}`]);
  // const tagIdReciept = await tagId.wait();
  // const filter = tagRepo.filters["TagCreated(uint256,string)"](null,null);
  // const tagIdLogs = tagIdReciept.logs;
  // const tagIdParseLogs = tagRepoAbiInterface.parseLog()

          // function* waitOnEvent(){
      //   const filter = tagRepo.filters["TagCreated(uint256,string)"](null,null);
      //   function callback(tagId: any,tagUri: any) {
      //     // const RecordTagId = await record.traceOneTag(tagRepo.address, tagId);
      //       return {
      //         tagId, 
      //         tagUri
      //       }
      //   }
      //   tagRepo.once(filter,callback);
      //   yield;

      // }