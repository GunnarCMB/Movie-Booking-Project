// userDB.js

const pool = require('./databasePool');
console.log('Successfully connected to the user database.');

const bcrypt = require('bcrypt');
const saltRounds = 10; // Recommended value for password hashing



async function fetchUserData() {
    try {
        const [users] = await pool.execute('SELECT * FROM users');
        // console.log('Retrieved user data:', users); // output the users
        return users;
    } catch (error) {
        console.error('An error occurred while fetching user data:', error);
        return [];
    }
}

async function findUserByUsernameAndPassword(username, submittedPassword) {
    try {
        const query = 'SELECT * FROM users WHERE username = ? LIMIT 1';
        const [users] = await pool.execute(query, [username]);

        if (users.length > 0) {
            const user = users[0];
            const storedPassword = user.password; // Assuming 'password' is the column name

            // Check if the stored password is likely hashed (bcrypt hashes are typically 60 characters long)
            if (storedPassword.length === 60) {
                // Use bcrypt to compare the submitted password with the hashed password
                const match = await bcrypt.compare(submittedPassword, storedPassword);
                if (match) {
                    return user; // Password matches, return user object
                }
            } else {
                // For plain text passwords (not recommended for nonencrypted pass)
                if (submittedPassword === storedPassword) {
                    return user; // Password matches, return user object
                }
            }
        }
        return null; // No user found or password does not match
    } catch (error) {
        console.error('An error occurred while fetching user data:', error);
        return null; // Return null in case of an error
    }
}


// find UN or Email ( for default registration )
async function findUserByEmailOrUsername(email, username) {
    try {
        const query = 'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1';
        const [users] = await pool.execute(query, [username, email]);
        return users.length > 0 ? users[0] : null;
    } catch (error) {
        console.error('An error occurred while checking user existence:', error);
        return null;
    }
}
// for finding users( admin user creation )
async function findUserByUsername(username) {
    try {
        const query = 'SELECT * FROM users WHERE username = ? LIMIT 1';
        const [users] = await pool.execute(query, [username]);
        return users.length > 0 ? users[0] : null;
    } catch (error) {
        console.error('An error occurred while checking user existence by username:', error);
        return null;
    }
}


//createUser
async function createUser({ firstName, lastName, phone, email, username, password, creditCard, billingAddress, enablePromotion, type, active }) {
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const query = `INSERT INTO users (type, active, first_name, last_name, phone, email, username, password, credit_card, billing_address, enable_promotion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.execute(query, [type, active, firstName, lastName, phone, email, username, hashedPassword, creditCard, billingAddress, enablePromotion]);
        return result;
    } catch (error) {
        console.error('An error occurred while creating user:', error.message, error.sql, error.sqlMessage);
        throw error;
    }
}



async function deleteUserById(id) {
    try {
        const query = 'DELETE FROM users WHERE user_id = ?';
        const [result] = await pool.execute(query, [id]);
        console.log(`Deleted user with ID: ${id}`);
        return result;
    } catch (error) {
        console.error('An error occurred while deleting user:', error);
        throw error; // Rethrowing the error to be handled by the caller
    }
}

async function updateUserActiveStatus(email, isActive) {
    try {
        const query = 'UPDATE users SET active = ? WHERE email = ?';
        const [result] = await pool.execute(query, [isActive, email]);
        console.log(`Updated user ${email} active status to ${isActive}`);
        return result;
    } catch (error) {
        console.error('An error occurred while updating user active status:', error);
        throw error;
    }
}

async function updatePassword(email, password) {
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const query = 'UPDATE users SET password = ? WHERE email = ?';
        const [result] = await pool.execute(query, [hashedPassword, email]);
        return result;
    } catch (error) {
        console.error('An error occurred while updating user password:', error.message, error.sql, error.sqlMessage);
        throw error;
    }
}


// updates the user from put requests
async function updateUserById(userId, userData) {
    // Hash the password if it's included in the update
    if (userData.password && userData.password.length !== 60) {
        userData.password = await bcrypt.hash(userData.password, saltRounds);
    }


    const query = `
        UPDATE users
        SET type = ?, first_name = ?, last_name = ?, username = ?, password = ?, email = ?, phone = ?, credit_card = ?, billing_address = ?, enable_promotion = ?, active = ?
        WHERE user_id = ?
    `;
    const params = [
        userData.type, userData.first_name, userData.last_name, userData.username, userData.password, userData.email, userData.phone, userData.credit_card, userData.billing_address, userData.enable_promotion, userData.active, userId
    ];
    try {
        const [result] = await pool.execute(query, params);
        return result;
    } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
    }
}

async function fetchUserDataById(userId) {
    try {
        const [user] = await pool.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        return user.length > 0 ? user[0] : null;
    } catch (error) {
        console.error('An error occurred while fetching user data by ID:', error);
        throw error;
    }
}//fetchUserData();

module.exports = {
    fetchUserData,
    fetchUserDataById,
    findUserByUsernameAndPassword,
    findUserByEmailOrUsername,
    findUserByUsername,
    createUser,
    deleteUserById,
    updateUserActiveStatus,
    updateUserById,
    updatePassword
};
