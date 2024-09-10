// paymentCardDB.js

const pool = require('./databasePool');
console.log('Successfully connected to the payment card database.');

// Gets all the Users(id) payment cards
async function fetchUserPaymentCards(id) {
    console.log(`Attempting to fetch payment cards for user ID: ${id}`);
    try {
        const [cards] = await pool.execute('SELECT * FROM payment_cards WHERE user_id = ?', [id]);
        return cards;
    } catch (error) {
        console.error('Error fetching payment cards:', error);
        throw error;
    }
} // fetch

// create Payment card
async function createPaymentCard({ userId, cardNumber, billingAddress, expirationDate }) {

    const [cards] = await pool.execute('SELECT COUNT(*) AS cardCount FROM payment_cards WHERE user_id = ?', [userId]);
    if (cards[0].cardCount >= 3) {
        throw new Error('User already has three payment cards.');
    }

    try {
        const query = `
            INSERT INTO payment_cards (user_id, card_number, billing_address, expiration_date)
            VALUES (?, ?, ?, ?);
        `;
        const [result] = await pool.execute(query, [userId, cardNumber, billingAddress, expirationDate]);
        return result;
    } catch (error) {
        console.error('An error occurred while creating a payment card:', error);
        throw error;
    }
} // create

//delete
async function deletePaymentCardById(cardId) {
    try {
        const query = 'DELETE FROM payment_cards WHERE card_id = ?';
        const [result] = await pool.execute(query, [cardId]);
        return result;
    } catch (error) {
        console.error('An error occurred while deleting payment card:', error);
        throw error;
    }
} // delete

module.exports = {
    fetchUserPaymentCards,
    createPaymentCard,
    deletePaymentCardById
};
