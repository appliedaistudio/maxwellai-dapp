import { putData } from './db-init-common.js';
import { AccessLevels } from '../ui/ui-auth.js';

// Dummy user data with access levels
const dummyUsers = [
    {_id: 'user_guest', username: 'guest', password: 'guest123', accessLevel: AccessLevels.GUEST},
    {_id: 'user_regular', username: 'user', password: 'user123', accessLevel: AccessLevels.USER},
    {_id: 'user_admin', username: 'admin', password: 'admin123', accessLevel: AccessLevels.ADMIN}
  ];

// Install bcrypt for secure hashing of passwords
var bcrypt = dcodeIO.bcrypt;

async function initializeUsers(db) {
  const saltRounds = 10; // You can adjust the number of salt rounds based on your security requirements

  // Process each user individually
  for (const user of dummyUsers) {
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      
      // Replace the plain text password with the hashed one
      const userWithHashedPassword = { ...user, password: hashedPassword };

      // Store the user in the database using the putData function
      await putData(db, userWithHashedPassword);
    } catch (error) {
      console.error('Error hashing password for user:', user.username, error);
      // Handle errors (e.g., log to console, display error message, etc.)
    }
  }
}

export { initializeUsers };
