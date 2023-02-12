import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from 'dotenv' 
dotenv.config()

function configFile(){
  let network: any = {};

  if (process.env.MUMBAI_URL_PROVIDER != undefined && process.env.MUMBAI_PVT_KEY != undefined){
    network["mumbai_testnet"] ={
      url: process.env.MUMBAI_URL_PROVIDER,
      accounts: [`${process.env.MUMBAI_PVT_KEY}`],
      gasPrice: 500000000
    }
  }

  if (process.env.INFURA_URL_PROVIDER != undefined && process.env.GOERLI_PVT_KEY != undefined){
    network["goerli_testnet"] ={
      url: process.env.INFURA_URL_PROVIDER,
      accounts: [`${process.env.GOERLI_PVT_KEY}`],
      gasPrice: 500000000
    }
  }

  if(process.env.HARDHAT_PVT_KEY != undefined){
    network["local_hardhat_testnet"]={
      url: `http://127.0.0.1:8545/`,
      accounts: [`${process.env.HARDHAT_PVT_KEY}`],
      gasPrice: 900000000
    }
  }

  if(process.env.GANACHE_PVT_KEY != undefined){
    network["local_ganache_testnet"]={
      url: `http://127.0.0.1:7545/`,
      accounts: [`${process.env.GANACHE_PVT_KEY}`],
      gasPrice: 900000000
    }
  }
  return network;
} 


const config: HardhatUserConfig = {
  solidity: "0.8.9",
  // defaultNetwork: "mumbai",
  networks: configFile()
};


export default config;
