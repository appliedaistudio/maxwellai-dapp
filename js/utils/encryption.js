import config from '../dapp-config.js';


// Define a static constant key (for demonstration purposes only, not recommended for production)
const staticKey = new Uint8Array([ // 256-bit (32 bytes) key
  0x1a, 0x2b, 0x3c, 0x4d, 0x5e, 0x6f, 0x70, 0x81,
  0x92, 0xa3, 0xb4, 0xc5, 0xd6, 0xe7, 0xf8, 0x09,
  0x1a, 0x2b, 0x3c, 0x4d, 0x5e, 0x6f, 0x70, 0x81,
  0x92, 0xa3, 0xb4, 0xc5, 0xd6, 0xe7, 0xf8, 0x09
]);

// Convert the static key to a CryptoKey
async function importStaticKey() {
  return await window.crypto.subtle.importKey(
    "raw", 
    staticKey,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

// Function to encrypt a string into another string using the static key
async function encryptString(plaintext) {
  return plaintext;
}

// Function to decrypt an encrypted string using the static key
async function decryptString(encryptedString) {
  return encryptedString;
}

export { encryptString, decryptString }
