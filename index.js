import Web3 from "web3";
import dotenv from "dotenv";
import axios from "axios";
import BN from "bn.js";
dotenv.config();

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// Web3 provider setup
const INFURA_URL = `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`;
const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_URL));

// Function to get holders
const getHolders = async () => {
    const url = `https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=${CONTRACT_ADDRESS}&apikey=${ETHERSCAN_API_KEY}`;
    const response = await axios.get(url);
    const transactions = response.data.result;

    const holders = new Set();

    // Assumption keys "to" as repsents the receiver of the NFT
    transactions.forEach((tx) => {
        holders.add(tx.to);
    });

    return holders;
};

// Function to get block number from epoch time
const getBlockByEpoch = async (epochTime) => {
    const url = `https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=${epochTime}&closest=before&apikey=${ETHERSCAN_API_KEY}`;

    const response = await axios.get(url);
    if (response.data.status === "1") {
        return parseInt(response.data.result, 10);
    } else {
        throw new Error(
            `Error fetching block number: ${response.data.message}`
        );
    }
};

// Function to get ETH balance from all addresses
const getTotalEthValueAtTime = async (epochTime) => {
    // Get block number from epoch time
    const blockNumber = await getBlockByEpoch(epochTime);
    console.log(`Block number for epoch ${epochTime}: ${blockNumber}`);

    // Get holders
    const holders = await getHolders();
    console.log(`Found ${holders.size} unique holders.`);

    // Initialize totalWei as Big Number
    let totalWei = new BN(0);

    for (const holder of holders) {
        // Get balance of holder at the given epoch
        const balance = await web3.eth.getBalance(holder, blockNumber);
        // console.log(`Balance for ${holder} at block ${blockNumber}: ${balance}`);
        const balanceWei = new BN(balance);
        totalWei = totalWei.add(balanceWei); // Add balance (in Wei) to totalWei
    }
    return web3.utils.fromWei(totalWei, "ether");
};

// Run the script
(async () => {
    try {
        const ts = "2024-12-13T08:00:03";
        const epochTime = Math.floor(new Date(`${ts}`).getTime() / 1000);

        const totalEth = await getTotalEthValueAtTime(epochTime);
        console.log(`Total ETH value at epoch ${epochTime}: ${totalEth} ETH`);
    } catch (error) {
        console.error("Error:", error.message);
    }
})();
