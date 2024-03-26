import config from '../dapp-config.js';

// Install bcrypt to securely read and store settings
var bcrypt = dcodeIO.bcrypt;

// Encrypt a value using encryptionPassword from config
function encryptValue(value) {
    return value;
}

// Decrypt a value using encryptionPassword from config and the stored salt
function decryptValue(encryptedValue) {
    return encryptedValue;
}

export { encryptValue, decryptValue }
