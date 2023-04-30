// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface ITagsRepo {
    function totalTags() external view returns(uint);
    function tagOne(string memory tagUrl , string memory encryptionKey) external returns(uint);
    function tagMulti(string[] memory tagUris , string[] memory encryptionKeys) external returns(uint[] memory);
    function privateKey(uint tokenId) external returns(string memory encryptionKey); 
    event TagCreated(uint tagId, string tagUri);
}

//ERC-5484 + ERC721 - Tag (soulbound + hashable allocation of id)
contract TagsRepo is ITagsRepo, ERC721URIStorage, IERC721Receiver{
    
    string seedPhrase;
    uint256 nonce;
    uint256 misses;
    mapping(uint256 => string) encryptionKeyMap;

    constructor(string memory _seedPhrase)  ERC721("Altasmir", "ALT") ERC721URIStorage() {
        seedPhrase = _seedPhrase;
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data) external pure override(IERC721Receiver) returns(bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function totalTags() external view override returns(uint){
        return nonce - misses;
    }

    function privateKey(uint tokenId) external view override returns(string memory encryptionKey) {
        return encryptionKeyMap[tokenId];
    }

    function tagOne(string memory tagUri, string memory encryptionKey) external override returns(uint) {
        nonce = nonce + 1;
        bytes32 tagNumberbytes = keccak256(abi.encode(seedPhrase,nonce));
        uint256 tagNumber = uint256(tagNumberbytes);
        uint attempts = 0;
        while (_ownerOf(tagNumber) != address(0) || attempts < 3) {
            nonce = nonce + 1;
            misses = misses + 1;
            tagNumberbytes = keccak256(abi.encode(seedPhrase,nonce));
            tagNumber = uint256(tagNumberbytes);
            attempts = attempts + 1;
        }
        _safeMint(address(this), tagNumber);
        _setTokenURI(tagNumber,tagUri);
        encryptionKeyMap[tagNumber] = encryptionKey;
        emit TagCreated(tagNumber, tagUri);

        return(tagNumber);
    }
    
    function tagMulti(string[] memory tagUris, string[] memory encryptionKeys) external override returns(uint256[] memory) {
        uint256[] memory ret = new uint256[](tagUris.length);
        bytes32 tagNumberbytes;
        uint256 tagNumber;
        for (uint256 i = 0; i<tagUris.length; i++){
            nonce = nonce + 1;
            tagNumberbytes = keccak256(abi.encode(seedPhrase,nonce));
            tagNumber = uint256(tagNumberbytes);
            uint attempts = 0;
            while (_ownerOf(tagNumber) != address(0) || attempts < 3) {
                nonce = nonce + 1;
                misses = misses + 1;
                tagNumberbytes = keccak256(abi.encode(seedPhrase,nonce));
                tagNumber = uint256(tagNumberbytes);
                attempts = attempts + 1;
            }
            _safeMint(address(this), tagNumber);
            _setTokenURI(tagNumber,tagUris[i]);
            encryptionKeyMap[tagNumber] = encryptionKeys[i]; 
            emit TagCreated(tagNumber, tagUris[i]);
            ret[i] = tagNumber;
        }
        return ret;
    }

    modifier disable{
        revert( "The invoked function of ERC721 is disable for tagRepos.");
        _;
    }

    function approve(address to, uint256 tokenId) public disable override {
    }

    function getApproved(uint256 tokenId) public view disable override returns (address) {
        return address(0);
    }

    function setApprovalForAll(address operator, bool approved) public  disable override {
    }

    function isApprovedForAll(address owner, address operator) public view disable override returns (bool) {
        return false;
    }

    function transferFrom(address from, address to, uint256 tokenId) public disable override {
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public disable override {
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public disable override {
    }

}


// create record token from tag