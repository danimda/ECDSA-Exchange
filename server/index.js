const express = require('express');
const app = express();
const cors = require('cors');
const EC = require('elliptic').ec;
const { SHA256 } = require('crypto-js');
const ec = new EC('secp256k1')
const port = 3042;
const generatedAccounts = 3;

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

const balances = {}

for(let i = 0; i < generatedAccounts; i++){
  const key = ec.genKeyPair();
  const publicKey = key.getPublic().encode('hex');
  const privateKey = key.getPrivate().toString(16);
  balances[publicKey] = 100;
  console.log({
    privateKey: privateKey,
    publicKey: publicKey,
    balance: balances[publicKey]
  });
}

app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const {tx, signature} = req.body;
  const {sender, recipient, amount} = tx;
  const key = ec.keyFromPublic(sender, 'hex');
  const msgHash = SHA256(JSON.stringify(tx)).toString();
  // console.log(msgHash.toString());
  if(!key.verify(msgHash, {r: signature.r, s: signature.s})){
    res.status(401).send({ err:'Signature is incorrect.' });
  } else {
    if(amount <= 0 || isNaN(amount)){
      res.status(400).send({ err:'Invalid amount: You can only transfer values greater than 0.' });
    } else if(balances[sender] < amount){
      const balance = balances[sender] || 0;
      res.status(402).send({ err:`Insufficient funds: Your account balance is ${balance}. You requested to transfer ${amount}.` });
    } else {
      balances[sender] -= amount;
      balances[recipient] = (balances[recipient] || 0) + +amount;
      res.send({ balance: balances[sender], message: 'Transfer Successful.' });
    }
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
