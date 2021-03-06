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

const showBalance = async () => {
  // Log balance at time now
  let balance = await wallet.getBalance();
  balance = ethers.utils.formatEther(balance);
  var date = new Date;
  date.setTime(date.getTime());
  let [year, month, day] = [date.getFullYear(), date.getMonth(), date.getDate()];
  let [seconds, minutes, hour] =[date.getSeconds(), date.getMinutes(), date.getHours()];
  var milliSeconds = date.getMilliseconds();
  const timeVerbose = month + '-' + day + '-' + year + ' ' + hour + ':' + minutes + ':' + seconds + ':' + milliSeconds;
  console.log('Time:', timeVerbose)
  console.log('Balance of', wallet.address, ':', balance, 'xDAI\n')
}

// ------------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------------

const getAddressesThatHaveThePOAP = async () => {
  const responseLimit = 0; // 0 is no limit
  // const url = `https://api.poap.xyz/event/27975/poaps?limit=${responseLimit}`; // EthDenver
  const url = `https://api.poap.xyz/event/39172/poaps?limit=${responseLimit}`; // EthAmsterdam
  
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
  const alreadyReceivedArray = alreadyReceivedAsStr.split(/\r?\n/); 
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
  const sendAmount = ethers.utils.parseEther("0.02") // "0.02" == 0.02 xDAI
  for (const addr of addresses) {

    const tx = {
      from: wallet.address,
      to: addr,
      value: sendAmount, 
      nonce: await wallet.getTransactionCount(),
      gasLimit: ethers.utils.hexlify(100000),
    }
    try {
      let txResp = await wallet.sendTransaction(tx);
      await txResp.wait()
      console.log('Sent', sendAmount, 'xDAI to:', addr)
      console.log('tx hash: ', txResp.hash)
    }
    catch (err) {
      console.log(err)
      console.log('Received an error after attempt to send xDAI to:', addr)
      continue;
    }

    const content = `${addr}\n`
    try {
      fs.appendFileSync('./alreadyReceived.txt', content);
    }
    catch (err) {
      console.log(err)
    }
  }
}

// ------------------------------------------------------------------------------------
// End functions
// ------------------------------------------------------------------------------------


// Execute
const main = async () => {
  while (true) {
    await showBalance()
    const addrsWithPOAP = await getAddressesThatHaveThePOAP();
    const addrsAlreadyFunded = getAddressesThatHaveReceivedFunds();
    const addrsToFund = await getAddressesToSendFundsTo(addrsWithPOAP, addrsAlreadyFunded);
    await sendFundsTo(addrsToFund);
  }
}
  
main().then(() => process.exit(0)).catch((error) => {
  console.log(error);
  process.exit(1);
})
  