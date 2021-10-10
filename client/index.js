import "./index.scss";
const EC = require('elliptic').ec;
const SHA256 = require('crypto-js/sha256');

const ec = new EC('secp256k1');

const server = "http://localhost:3042";

document.getElementById("exchange-address").addEventListener('input', ({ target: {value} }) => {
  if(value === "") {
    document.getElementById("balance").innerHTML = 0;
    return;
  }

  fetch(`${server}/balance/${value}`).then((response) => {
    return response.json();
  }).then(({ balance }) => {
    document.getElementById("balance").innerHTML = balance;
  });
});

document.getElementById("transfer-amount").addEventListener('click', () => {
  let messageElement = document.getElementById("message");
  messageElement.innerHTML = "";
 
  let tx = getTransactionData();
  let signature = signData(tx);

  let body = JSON.stringify({
    tx, signature
  });
  const request = new Request(`${server}/send`, { method: 'POST', body });

  fetch(request, { headers: { 'Content-Type': 'application/json' }}).then(response => {
    response.json().then(data =>{
      if(response.ok) {
        document.getElementById("balance").innerHTML = data.balance;
        messageElement.innerHTML = data.message;
      } else {
        messageElement.innerHTML = data.err;
      }
    });
  }).catch( error => {
    console.log("Error: ", error);
  });
});

function getTransactionData(){
  let sender = document.getElementById("exchange-address").value;
  let amount = document.getElementById("send-amount").value;
  let recipient = document.getElementById("recipient").value;

  return {"sender":sender, "recipient":recipient, "amount":amount};
}

function signData(data){
  let privateKey = document.getElementById("privateKey").value;
  let key = ec.keyFromPrivate(privateKey);
  let msgHash = SHA256(JSON.stringify(data));
  // console.log(msgHash.toString());
  return key.sign(msgHash.toString());
}
