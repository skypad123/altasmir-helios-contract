// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";
import 'erc721a/contracts/ERC721A.sol';
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {ERC165Checker} from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import  "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "./TagRepo.sol";


struct recordTagsData{
    address tagRepoAddress;
    uint tagId;
}

interface IRecord {
    function immutableFrom()external returns(uint);
    function traceOneTag(address tagRepoAddress, uint tagId) external returns(uint);
    function traceMultiTags(address tagRepoAddress, uint[] memory tagIds) external returns(uint);
    function sign() external;
    function hasSigned(address signer) external returns(bool);

    event TagTraced(uint indexed tagTraceId , address indexed tagRepoAddress, uint indexed tagId);
    event RecordSigned(address indexed signer);
}

contract Record is IERC165, IRecord, ERC721A, Ownable {
    using ERC165Checker for address; 
    uint public immutableDatetime;
    uint public recordChainLength;
    address[] public recordParentRecords;
    mapping(address => bool) recordSignatures;
    mapping(uint => recordTagsData) tagsMap;  

    constructor(address[] memory parentRecords, string memory personalisedName, string memory taghash, uint expiryDatetime) ERC721A(personalisedName, taghash )Ownable() {
        //set time Duration

        immutableDatetime = expiryDatetime;

        //set ChainLength
        if (parentRecords.length == 0) {
            recordChainLength = 0;
        }else{

            for (uint i; i < parentRecords.length; i++){
                address target = parentRecords[0];
                if ( !target.supportsInterface(calculateSelector())) {
                    revert("There are Inserted Parent Address are not Past Record Contracts.");
                }
                Record recordTarget = Record(target);
                if ( block.timestamp <= recordTarget.immutableFrom()) {
                    revert("There are Inserted Parent Address are Mutable.");
                }
            }
            recordChainLength = Record(parentRecords[0]).recordChainLength() + 1;
        }
        //set parentRecords
        recordParentRecords = parentRecords;

        //transfer ownership to tx.caller
        _transferOwnership(tx.origin);

    }

    function supportsInterface(bytes4 interfaceID) public view override(ERC721A, IERC165) returns (bool) {
        return ERC721A.supportsInterface(interfaceID) || 
         interfaceID == calculateSelector();
    }

    function calculateSelector() internal pure returns (bytes4) {
        return this.immutableFrom.selector
                ^ this.traceOneTag.selector
                ^ this.traceMultiTags.selector
                ^ this.sign.selector
                ^ this.hasSigned.selector; 
    }


    modifier isBuildingPhase{
        require(block.timestamp <= immutableDatetime, "called function is only usable during building period.");
        _;
    }

    modifier isImmutable{
        require(block.timestamp > immutableDatetime, "called function is only available when contract is immutable.");
        _;
    }

    function immutableFrom() public view override returns(uint) {
        return immutableDatetime;
    }

    function traceOneTag(address tagRepoAddress, uint tagId ) public isBuildingPhase override returns(uint){
        uint totalMinted = _totalMinted();
        _mint(address(this),1);
        tagsMap[totalMinted].tagRepoAddress = tagRepoAddress;
        tagsMap[totalMinted].tagId = tagId;
        emit TagTraced( totalMinted, tagRepoAddress, tagId);
        return(totalMinted);
    }

    function traceMultiTags(address tagRepoAddress, uint[] memory tagIds) public isBuildingPhase override returns(uint){
        //mint fixed amount
        uint totalMinted = _totalMinted();
        _mint(address(this),tagIds.length);
        //loop thru tags and check if they are unburnable then set url value
        for(uint i = 0; i < tagIds.length; i++){
            tagsMap[i + totalMinted].tagRepoAddress = tagRepoAddress;
            tagsMap[i + totalMinted].tagId = tagIds[i];
            emit TagTraced( i + totalMinted, tagRepoAddress, tagIds[i] );
        } 
        return(totalMinted);
    }



    function sign() isImmutable external{
        recordSignatures[msg.sender] = true;
        emit RecordSigned(msg.sender);
    }

    function hasSigned( address signer) isImmutable external view returns(bool){
        return(recordSignatures[signer]);
    }



    modifier disable{
        revert("The invoked function of ERC721 is disable for Records.");
        _;
    }

    function approve(address to, uint256 tokenId) public payable disable override {
    }

    function getApproved(uint256 tokenId) public view disable override returns (address) {
        return address(0);
    }

    function setApprovalForAll(address operator, bool approved) public  disable override {
    }

    function isApprovedForAll(address owner, address operator) public view disable override returns (bool) {
        return false;
    }

    function transferFrom(address from, address to, uint256 tokenId) public payable  disable override {
    }

    // function safeTransferFrom(address from, address to, uint256 tokenId) public payable disable override {
    // }

    // function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public payable disable override {
    // }

}



// ERC721A instance - Records -> NFT +  holds singatures

