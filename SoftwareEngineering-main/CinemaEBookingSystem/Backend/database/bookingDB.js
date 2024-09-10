const pool = require('./databasePool');
console.log('Successfully connected to the booking database.');




// Create a new order into the orders table
async function createInitialOrder({ userId, showtimeId, movieTitle, showtimeDateTime, numAdultTickets, numSeniorTickets, numChildTickets, totalPrice }) {
    try {
        const query = `
            INSERT INTO orders (user_id, showtime_id, movie_title, showtime_datetime, num_adult_tickets, num_senior_tickets, num_child_tickets, total_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const [result] = await pool.execute(query, [userId, showtimeId, movieTitle, showtimeDateTime, numAdultTickets, numSeniorTickets, numChildTickets, totalPrice]);
        return result.insertId; // Return the ID of the newly created order
    } catch (error) {
        console.error('An error occurred while creating an order:', error);
        throw error;
    }
}

// find Order per USer
async function findOrdersByUserID(userId) {
    if (userId === undefined) {
        console.log('Received undefined userId');
        throw new Error('userId is undefined');
    }
    try {
        const [orders] = await pool.execute('SELECT * FROM orders WHERE user_id = ?', [userId]);
        return orders;
    } catch (error) {
        console.error('Error fetching orders by user ID:', error);
        throw error;
    }
}

// delete order by id
async function deleteOrder(orderId) {
    try {
        const query = 'DELETE FROM orders WHERE order_id = ?';
        await pool.execute(query, [orderId]);
    } catch (error) {
        console.error('Error deleting order:', error);
        throw error;
    }
}

// Update the existing updateOrderStatus function to include the status update
async function updateOrderStatus(orderId, status) {
    if (!orderId || !status) {
        throw new Error('Order ID and status must be provided');
    }
    try {
        const query = 'UPDATE orders SET status = ? WHERE order_id = ?';
        const [result] = await pool.execute(query, [status, orderId]);
        return result;
    } catch (error) {
        console.error('An error occurred while updating an order:', error);
        throw error;
    }
}

// cancel Order
async function cancelOrderAndGetShowtime(orderId) {
    // Start a transaction or a series of operations
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [order] = await connection.query('SELECT showtime_id FROM orders WHERE order_id = ?', [orderId]);
        await connection.query('UPDATE orders SET status = ? WHERE order_id = ?', ['canceled', orderId]);
        await connection.commit();
        return order.length ? { showtime_id: order[0].showtime_id } : null;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// Function to find order by orderId
async function findOrderById(orderId) {
    console.log('Fetching details for orderId:', orderId);  // Debugging
    if (!orderId) {
        throw new Error('orderId must not be undefined');
    }
    try {
        const [orders] = await pool.execute('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        return orders[0]; // Assuming orderId is unique and only one record should be returned
    } catch (error) {
        console.error('Error fetching order by ID:', error);
        throw error;
    }
}


// Find seats by showtime ID
async function findSeatsByShowtime(showtimeId) {
    try {
        const [seats] = await pool.execute('SELECT * FROM seats WHERE showtime_id = ?', [showtimeId]);
        return seats;
    } catch (error) {
        console.error('Error fetching seats:', error);
        throw error;
    }
}

// Create seats for a showtime
async function createSeats(showtimeId, number) {
    const seats = [];
    for (let i = 1; i <= number; i++) {
        const seatNumber = `${i}`;
        seats.push(pool.execute('INSERT INTO seats (showtime_id, seat_number) VALUES (?, ?)', [showtimeId, seatNumber]));
    }
    await Promise.all(seats);
    return seats.map((_, index) => ({ seat_id: index + 1, showtime_id: showtimeId, seat_number: `S${index + 1}`, is_occupied: false }));
}


// Export necessary functions
module.exports = {
    updateOrderStatus, // need to reimplement
    createInitialOrder,
    findOrdersByUserID,
    deleteOrder,
    cancelOrderAndGetShowtime,
    findOrderById,
    findSeatsByShowtime,
    createSeats
};
