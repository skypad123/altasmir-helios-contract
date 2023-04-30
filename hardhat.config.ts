import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

function configFile() {
	let network: any = {};

	if (
		process.env.MUMBAI_URL_PROVIDER != undefined &&
		process.env.MUMBAI_PVT_KEY != undefined
	) {
		network["mumbai_testnet"] = {
			url: process.env.MUMBAI_URL_PROVIDER,
			accounts: [`${process.env.MUMBAI_PVT_KEY}`],
			gasPrice: 500000000,
		};
	}

	if (
		process.env.INFURA_URL_PROVIDER != undefined &&
		process.env.GOERLI_PVT_KEY != undefined
	) {
		network["goerli_testnet"] = {
			url: process.env.INFURA_URL_PROVIDER,
			accounts: [`${process.env.GOERLI_PVT_KEY}`],
			gasPrice: 500000000,
		};
	}

	if (process.env.HARDHAT_PVT_KEY != undefined) {
		network["local_hardhat_testnet"] = {
			url: `http://127.0.0.1:8545/`,
			accounts: [`${process.env.HARDHAT_PVT_KEY}`],
			gasPrice: 900000000,
		};
	}

	if (process.env.GANACHE_PVT_KEY != undefined) {
		network["local_ganache_testnet"] = {
			url: `http://127.0.0.1:7545/`,
			accounts: [`${process.env.GANACHE_PVT_KEY}`],
			gasPrice: 900000000,
		};
	}
	return network;
}

const config: HardhatUserConfig = {
	solidity: "0.8.9",
	defaultNetwork: "mumbai_testnet",
	networks: configFile(),
	typechain: {
		outDir: "src/types",
		target: "ethers-v5",
		alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
		externalArtifacts: ["externalArtifacts/*.json"], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
		dontOverrideCompile: false, // defaults to false
	},
};

export default config;
