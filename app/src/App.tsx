import React, { useState, useEffect} from 'react';
import { ethers } from 'ethers';
import { startRegistration } from '@simplewebauthn/browser';
import './App.css'
import CryptoJS from 'crypto-js';

const ENDPOINT = 'http://localhost:8787'

const WalletLogin = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [wallet, setWallet] = useState<any>(null);
  const [isUnique, setIsUnique] = useState<any>(null);
  const [errorMessage, _] = useState('');
  const [signedMessage, setSignedMessage] = useState('');

  async function registerUsbSecurityKey() {
    const options = await fetchJSON(`${ENDPOINT}/register-options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userID: username, userName: email }),
    });
  
    const attResp = await startRegistration(options);
  
    const res: any = await fetchJSON(`${ENDPOINT}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userID: username, attResp }),
    });
  
    return res
  }

  const handleLogin = async () => {
    const res = await registerUsbSecurityKey();

    console.log(res)

    setIsUnique(true);

    // Example 42-character string
    const inputString = res.publicKey

    const hash = CryptoJS.SHA256(inputString).toString(CryptoJS.enc.Hex);

    // Convert the hash to a private key
    const privateKey = `0x${hash}`;

    console.log('Generated Private Key:', privateKey);

    const wallet = new ethers.Wallet(privateKey);
    console.log('Address:', wallet.address);
    setWalletAddress(wallet.address);
    setWallet(wallet);

  };

  const signMessage = async () => {
      const signedMessage = await wallet.signMessage('howdy world');
      console.log(signedMessage)
      setSignedMessage(signedMessage);
  }

  useEffect(()=>{

  }, [signedMessage, wallet])

  return (
    <div>
      {!walletAddress && <>
        <input
        style={{height: '30px'}}
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter Username"
        /></>}
        <br/>
        <br/>
        <div>
          {!walletAddress && <><input
        style={{height: '30px'}}

            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter Email"
          />
          <br/> 
          <br/> 
          <button onClick={handleLogin}>Login Wallet</button></>}
          <div className="button-container">
            {walletAddress && <><p>Wallet Address: {walletAddress}</p>
            <br/>
            </>}
          </div>
          <br/>
            {walletAddress && <><button onClick={signMessage}>Sign Message</button>
            <br/>
            <br/>
            {signedMessage}</>}
        </div>
      {isUnique === false && (
        <div style={{ color: 'red' }}>
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
};

async function fetchJSON(url: any, options: any) {
  const response = await fetch(url, options);
  return response.json();
}

function App(){

  return (
    <div>
      <div className="button-container">
        <WalletLogin/>
      </div>
    </div>
  );
}

export default App;
