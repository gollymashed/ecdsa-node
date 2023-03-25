const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const hashMessage = require('./hashMessage');
const secp = require('ethereum-cryptography/secp256k1');
const { toHex } = require("ethereum-cryptography/utils");
const { keccak256 } = require("ethereum-cryptography/keccak");

app.use(cors());
app.use(express.json());

const balances = {
  "b89abc410864e9fcd0375117dfc69a4496c20c17": 100,
  "90c9111eefd42e5fbf6124bb353a9068bef728d0": 50,
  "648e48f92f26ed3bcc771c67beba3d4b98a5c594": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  console.log("balance: " + balance);
  res.send({ balance });
});

app.post("/send", async (req, res) => {
  const { sender, signature, recipient, amount, recoveryBit } = req.body;
  
  const hashedMessage = hashMessage(recipient + amount);
  const signatureUtf8 = Buffer.from(signature, 'base64');
  const publicKey = secp.recoverPublicKey(hashedMessage, signatureUtf8, recoveryBit);
  const address = toHex(keccak256(publicKey.slice(1)).slice(-20));

  if (address !== sender) {
    res.status(400).send({ message: "Invalid signature!" });
  }

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
