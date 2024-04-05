import config from '../dapp-config.js';
import { log } from './logging.js'

// Define the static key globally
const staticKeyHex = "00112233445566778899aabbccddeeff";
const staticKey = new Uint8Array(staticKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

// Convert the static key to a CryptoKey
async function importStaticKey() {
  try {
    const key = await self.crypto.subtle.importKey(
      "raw", 
      staticKey,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );
    return key;
  } catch (error) {
    throw new Error(`Importing static key failed: ${error.message}`);
  }
}

// Function to decrypt an encrypted string using the static key
async function decryptString(encryptedString) {
  try {
    const separatorIndex = encryptedString.indexOf("|");
    if (separatorIndex === -1) {
      throw new Error("Invalid encrypted string format: Separator '|' not found.");
    }
    const ivBase64 = encryptedString.substring(0, separatorIndex);
    const cipherTextBase64 = encryptedString.substring(separatorIndex + 1);

    const iv = new Uint8Array(Array.from(atob(ivBase64), c => c.charCodeAt(0)));
    const cipherText = new Uint8Array(Array.from(atob(cipherTextBase64), c => c.charCodeAt(0)));

    const key = await importStaticKey();

    const decryptedData = await self.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      cipherText
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

// Function to encrypt a string into another string using the static key
async function encryptString(plaintext) {
  try {
    const encoder = new TextEncoder();
    const encodedPlaintext = encoder.encode(plaintext);

    const iv = self.crypto.getRandomValues(new Uint8Array(12)); // Generate a random initialization vector

    const key = await importStaticKey();

    const cipherText = await self.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encodedPlaintext
    );

    const encryptedData = {
      iv: iv,
      cipherText: new Uint8Array(cipherText)
    };

    const serializedEncryptedData = btoa(String.fromCharCode.apply(null, encryptedData.iv)) + "|" + btoa(String.fromCharCode.apply(null, encryptedData.cipherText));
    return serializedEncryptedData;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

export { encryptString, decryptString }

async function testEncryption() {
  console.log("testing encryption");

  const password = "ESTP-The Entrepreneur";
  console.log(`the password is ${password}`);

  const encryptedPassword = await encryptString(password);
  console.log(`the encrypted password is ${encryptedPassword}`);

  const decryptedPassword = await decryptString(encryptedPassword);
  console.log(`the decrypted password is ${decryptedPassword}`);
}

//testEncryption();
