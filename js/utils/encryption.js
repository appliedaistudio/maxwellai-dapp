
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
  try {
    console.log("encrypting:", plaintext);
    
    const encoder = new TextEncoder();
    const encodedPlaintext = encoder.encode(plaintext);

    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Generate a random initialization vector

    const key = await importStaticKey();

    const cipherText = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encodedPlaintext
    );

    // Convert encrypted data to Base64-encoded string
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

// Function to decrypt an encrypted string using the static key
async function decryptString(encryptedString) {
  try {
    console.log("Decrypting:", encryptedString);

    // Decode Base64-encoded string and parse JSON
    const separatorIndex = encryptedString.indexOf("|");
    if (separatorIndex === -1) {
      throw new Error("Invalid encrypted string format: Separator '|' not found.");
    }
    const ivBase64 = encryptedString.substring(0, separatorIndex);
    const cipherTextBase64 = encryptedString.substring(separatorIndex + 1);

    console.log("IV Base64:", ivBase64);
    console.log("CipherText Base64:", cipherTextBase64);

    // Convert Base64-encoded strings to Uint8Arrays
    const iv = new Uint8Array(Array.from(atob(ivBase64), c => c.charCodeAt(0)));
    const cipherText = new Uint8Array(Array.from(atob(cipherTextBase64), c => c.charCodeAt(0)));

    console.log("IV Uint8Array:", iv);
    console.log("CipherText Uint8Array:", cipherText);

    const key = await importStaticKey();

    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      cipherText
    );

    const decoder = new TextDecoder();
    console.log("Decrypted Data:", decryptedData);
    
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

export { encryptString, decryptString }

async function testEncryption() {
  console.log("testing encryption");

  const password = "password";
  console.log(`the password is ${password}`);

  const encryptedPassword = await encryptString(password);
  console.log(`the encrypted password is ${encryptedPassword}`);

  const decryptedPassword = await decryptString(encryptedPassword);
  console.log(`the decrypted password is ${decryptedPassword}`);
}

testEncryption();
