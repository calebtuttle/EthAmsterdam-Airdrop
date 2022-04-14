import 'dotenv/config';
import fs from 'fs';
import fetch from 'node-fetch';
import ethers from 'ethers';


// ------------------------------------------------------------------------------------
// Contants
// ------------------------------------------------------------------------------------

const privateKey = process.env.PRIVATE_KEY1;
const gnosisChainRpc = 'https://rpc.gnosischain.com/';
const provider = new ethers.providers.JsonRpcProvider(gnosisChainRpc, 100);
const wallet = new ethers.Wallet(privateKey, provider);

const mnemonic = process.env.MNEMONIC;
const tempWallet = new ethers.Wallet.fromMnemonic(mnemonic);
const wallet2 = new ethers.Wallet(tempWallet.privateKey, provider)

let balance = await wallet.getBalance();
console.log('Wallet balance: ', balance)


// ------------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------------

const getAddressesThatHaveThePOAP = async () => {
  const responseLimit = 0; // 0 is no limit
  // const url = `https://api.poap.xyz/event/27975/poaps?limit=${responseLimit}`; // EthDenver
  const url = `https://api.poap.xyz/event/38934/poaps?limit=${responseLimit}`; // EthAmsterdam
  
  const resp = await fetch(url);
  const poaps = await resp.json();
  
  const tokens = poaps['tokens'];
  const addresses = tokens.map(token => token['owner']['id']);
  return addresses;
}

const getAddressesThatHaveReceivedFunds = () => {
  // Determine addresses that have already received funds
  let alreadyReceivedAsStr = '';
  try {
    alreadyReceivedAsStr = fs.readFileSync('./alreadyReceived.txt', 'utf8');
  }
  catch (err) {
    console.log(err)
  }
  const alreadyReceivedArray = alreadyReceivedStr.split(/\r?\n/); 
  const alreadyReceived = alreadyReceivedArray.map(addr => addr.trim())
  return alreadyReceived;
}

const getAddressesToSendFundsTo = (allAddresses, alreadyReceived) => {
  const haventReceived = allAddresses.filter(address => { 
    return alreadyReceived.indexOf(address) < 0;
  });
  return haventReceived;
}

const sendFundsTo = async (addresses) => {
  // airdrop -- send these mfs money
  // const sendAmount = 20000000000000000; // == 2 * (10 ** 16) == 0.02 xDAI
  for (const addr of addresses) {
  
    const tx = {
      from: wallet.address,
      to: addr,
      value: ethers.utils.parseEther("0.001"), // "0.001" == 0.001 xDAI
      nonce: await wallet.getTransactionCount(),
      gasLimit: ethers.utils.hexlify(100000),
    }
    await wallet.sendTransaction(tx);
  
    const content = `${addr}\n`
    try {
      fs.appendFileSync('./alreadyReceived.txt', content);
    }
    catch (err) {
      console.log(err)
    }
  }
}

function fileTests() {
  let alreadyReceivedAsStr = '';
  try {
    alreadyReceivedAsStr = fs.readFileSync('./alreadyReceived.txt', 'utf8');
  }
  catch (err) {
    console.log(err)
  }
  const alreadyReceivedArray = alreadyReceivedAsStr.split(/\r?\n/); 
  const alreadyReceived = alreadyReceivedArray.map(addr => addr.trim())

  for (let i = 0; i < 5; i++) {
    if (alreadyReceived.indexOf(i.toString()) != -1) {
      continue;
    }
    const content = `${i}\n`
    try {
      fs.appendFileSync('./alreadyReceived.txt', content);
    }
    catch (err) {
      console.log(err)
    }
  }
  console.log(alreadyReceived + '\n')
  console.log(alreadyReceived[0])
}

// ------------------------------------------------------------------------------------
// End functions
// ------------------------------------------------------------------------------------

// await wallet.sendTransaction(tx);


// const addrsWithPOAP = await getAddressesThatHaveThePOAP();
// const addrsAlreadyFunded = getAddressesThatHaveReceivedFunds();
// const addrsToFund = await getAddressesToSendFundsTo(addrsWithPOAP, addrsAlreadyFunded);
// await sendFundsTo(addrsToFund);


balance = await wallet.getBalance();
console.log('Wallet balance before (shared): ', balance)
balance = await wallet2.getBalance();
console.log('Wallet balance before (mine)  : ', balance)

const tx = {
  from: wallet2.address,
  to: wallet.address,
  value: ethers.utils.parseEther("0.001"),
  nonce: await wallet.getTransactionCount(),
  gasLimit: ethers.utils.hexlify(100000),
}
// await wallet2.sendTransaction(tx);


balance = await wallet.getBalance();
console.log('Wallet balance after (shared): ', balance)
balance = await wallet2.getBalance();
console.log('Wallet balance after (mine)  : ', balance)
