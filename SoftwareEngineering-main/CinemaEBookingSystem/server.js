// server.js
//require('dotenv').config();

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const movieDB = require('./Backend/database/movieDB');
const paymentCardDB = require('./Backend/database/paymentCardDB');
const userDB = require('./Backend/database/userDB');
const bookingDB = require('./Backend/database/bookingDB'); // not implemnted yet

const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');

const app = express();
const port = 3000; // You can choose any port number
const cors = require('cors');

app.use(cors({
    origin: 'http://localhost:3000' // or the correct URL of your frontend
}));
app.use(express.static(path.join(__dirname, 'Frontend/src'))); // connects Front and Back
app.use(express.json());

console.log('initiating server...');

// Configure SendGrid API key
sgMail.setApiKey('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');


/** ----------------------------------------------------*/
/** ------------------Route Divider---------------------*/
/** ----------------------------------------------------*/
/** --------------------Orders--------------------------*/

// Route to get seats by showtimeId
app.get('/api/seats/:showtimeId', async (req, res) => {
    const showtimeId = req.params.showtimeId;
    try {
        const seats = await bookingDB.findSeatsByShowtime(showtimeId);
        if (seats.length > 0) {
            const unoccupiedSeats = seats.filter(seat => !seat.is_occupied);
            res.json({ seats, unoccupiedSeats: unoccupiedSeats.length });
        } else {
            res.status(404).json({ message: 'No seats found' });
        }
    } catch (error) {
        console.error('Error fetching seats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to create seats for a showtime
// Route to create seats for a showtime
app.post('/api/seats', async (req, res) => {
    const { showtimeId } = req.body;
    if (!showtimeId) {
        return res.status(400).json({ error: 'Showtime ID is required' });
    }
    try {
        const seats = await bookingDB.createSeats(showtimeId, 10); // Assuming we want to create 10 seats
        res.status(201).json({ message: 'Seats created successfully', seats });
    } catch (error) {
        console.error('Error creating seats:', error);
        res.status(500).json({ error: 'Failed to create seats. Please try again later.' });
    }
});




// Route to get order details by orderId
app.get('/api/orders/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
    }
    try {
        const orderDetails = await bookingDB.findOrderById(orderId);
        if (orderDetails) {
            res.json(orderDetails);
        } else {
            res.status(404).send('Order not found');
        }
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route for booking a movie
app.post('/api/bookings', async (req, res) => {
    console.log("Received booking data:", req.body);
    const { userId, showtimeId, numAdultTickets, numSeniorTickets, numChildTickets, totalPrice, movieTitle, showtimeDateTime } = req.body;
    // Ensure none of the required parameters are undefined
    if (!userId || !showtimeId || numAdultTickets === undefined || numSeniorTickets === undefined || numChildTickets === undefined || !totalPrice || !movieTitle || !showtimeDateTime) {
        return res.status(400).json({ error: 'Missing required booking details' });
    }

    try {
        const orderId = await bookingDB.createInitialOrder({
            userId, showtimeId, movieTitle, showtimeDateTime, numAdultTickets, numSeniorTickets, numChildTickets, totalPrice
        });
        res.json({ orderId: orderId, message: "Booking successfully created." });
    } catch (error) {
        console.error('Error booking movie:', error);
        res.status(500).json({ error: 'Failed to book movie. Please try again later.' });
    }
});


// Fetch order history for a specific user
app.get('/api/orders/user/:userId', async (req, res) => {
    console.log('User ID:', req.params.userId); // Debugging: Check what value is being passed
    try {
        if (req.params.userId === undefined) {
            return res.status(400).send('User ID is undefined');
        }
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).send('Invalid user ID');
        }
        const orders = await bookingDB.findOrdersByUserID(userId);
        if (orders.length > 0) {
            res.json(orders);
        } else {
            res.status(404).send('No orders found');
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route for deleting an order by order ID
app.delete('/api/orders/:order_id', async (req, res) => {
    const orderId = req.params.order_id;
    try {
        await bookingDB.deleteOrder(orderId);
        res.sendStatus(204); // Send a success response
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order. Please try again later.' });
    }
});

// Route to cancel an order
app.put('/api/orders/cancel/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    try {
        const order = await bookingDB.cancelOrderAndGetShowtime(orderId); // This needs to be implemented in your bookingDB
        if (order) {
            res.json({ message: 'Order canceled successfully', showtimeId: order.showtime_id });
        } else {
            res.status(404).send('Order not found');
        }
    } catch (error) {
        console.error('Error canceling order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


/** --------------------Orders--------------------------*/
/** ----------------------------------------------------*/
/** ------------------Route Divider---------------------*/
/** ----------------------------------------------------*/
/** -------------------Showtimes------------------------*/

/* v SHOWTIMES v */

//fetch specific showtime by id
// Fetch a specific showtime by ID
app.get('/api/showtimes/details/:showtime_id', async (req, res) => {
    try {
        const showtimeId = req.params.showtime_id;
        const showtime = await movieDB.fetchShowtimeById(showtimeId);
        if (!showtime) {
            return res.status(404).send('Showtime not found');
        }
        res.json(showtime);
    } catch (error) {
        console.error('Failed to fetch showtime:', error);
        res.status(500).send('Server error while fetching showtime');
    }
});

// Fetch showtimes for a specific movie
app.get('/api/showtimes/:movie_id', async (req, res) => {
    try {
        const movieId = req.params.movie_id;
        const showtimes = await movieDB.fetchShowtimesByMovieId(movieId);
        res.json(showtimes);
    } catch (error) {
        console.error('Failed to fetch showtimes:', error);
        res.status(500).send('Server error while fetching showtimes');
    }
});

//Add a showtime to relevent Movie
app.post('/api/showtimes', async (req, res) => {
    const { movieId, showtime } = req.body;
    try {
        const showtimeId = await movieDB.createShowtime(movieId, showtime);
        res.status(201).send({ message: 'Showtime added successfully', showtimeId });
    } catch (error) {
        console.error('Failed to add showtime:', error);
        res.status(500).send('Server error while adding showtime');
    }
});

// Delete a specific showtime
app.delete('/api/showtimes/:showtime_id', async (req, res) => {
    const showtimeId = req.params.showtime_id;
    try {
        const result = await movieDB.deleteShowtime(showtimeId);
        if (result.affectedRows > 0) {
            res.status(200).send('Showtime deleted successfully.');
        } else {
            res.status(404).send('Showtime not found.');
        }
    } catch (error) {
        console.error('Failed to delete showtime:', error);
        res.status(500).send('Server error while deleting showtime');
    }
});

/* ^ SHOWTIMES ^ */
/** -------------------Showtimes------------------------*/
/** ----------------------------------------------------*/
/** ------------------Route Divider---------------------*/
/** ----------------------------------------------------*/
/** -----------------Movies & Promos--------------------*/
/* v MOVIES v */

// delete specific movies ( admin )
app.delete('/api/movies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Assuming deleteMovieById is a function you implement in movieDB that deletes a movie by ID
        await movieDB.deleteMovieById(id);
        res.status(200).send('Movie deleted successfully.');
    } catch (error) {
        console.error('Error deleting movie:', error);
        res.status(500).send('Failed to delete movie.');
    }
});

// Get all movies
app.get('/api/movies', async (req, res) => {
    console.log('API request for movies');
    try {
        const movies = await movieDB.fetchMovieData(); // Assuming you have a fetchMovieData function in movieDB
        res.json(movies);
    } catch (error) {
        console.error('Error handling /api/movies:', error.message);
        res.status(500).send('Server error');
    }
});
const { fetchMovieById } = require('./Backend/database/movieDB');

// Get a specific movie by ID
app.get('/api/movies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const movie = await fetchMovieById(id); // Use fetchMovieById here

        if (movie) {
            res.json(movie);
        } else {
            res.status(404).send('Movie not found.');
        }
    } catch (error) {
        console.error('Error handling /api/movies/:id:', error.message);
        res.status(500).send('Server error');
    }
});

// Get a specific movie by ID
app.get('/api/movies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const movie = await fetchMovieById(id); // Use fetchMovieById here
        console.log(movie);
        if (movie) {
            res.json(movie);
        } else {
            res.status(404).send('Movie not found.');
        }
    } catch (error) {
        console.error('Error handling /api/movies/:id:', error.message);
        res.status(500).send('Server error');
    }
});

// create movies ( admin )
app.post('/api/movies', async (req, res) => {
    const movieData = req.body;

    try {
       await movieDB.createMovie(movieData);
        res.status(201).send('Movie created successfully.');
    } catch (error) {
        console.error('Error creating movie:', error);
        res.status(500).send('Failed to create movie.');
    }
});

// UpdateMovie ( admin )
app.put('/api/movies/:id', async (req, res) => {
    const { id } = req.params;
    const movieData = req.body;
    //console.log('Received movieData:', movieData);

    try {
        const result = await movieDB.updateMovieById(id, movieData);
        //console.log('Update result:', result);
        res.status(200).send('Movie updated successfully.');
    } catch (error) {
        console.error('Error updating movie:', error);
        res.status(500).send('Failed to update movie.');
    }
});
/* ^ MOVIES ^ */

//PROMOTIONS
//Send email for new promotion added 
app.post('/api/send-email', async (req, res) => {
    const { email, content } = req.body;
    console.log('sending email to:' + email);

    if (!email || !content) {
        return res.status(400).send('Email and content are required.');
    }

    try {
        const msg = {
            to: email,
            from: 'hunter.mcvay@outlook.com',
            subject: 'Promotional Email from E-Cinema',
            html: content,
        };
        await sgMail.send(msg);

        res.status(200).send('Promotional email sent.');
    } catch (error) {
        console.error('Error sending promotional email:', error);
        res.status(500).send(`An error occurred: ${error.message}`);
    }
});

// Get all movies with promotional prices
app.get('/api/movies/promotions', async (req, res) => {
    try {
        const promotedMovies = await movieDB.fetchPromotedMovies();
        res.json(promotedMovies);
    } catch (error) {
        console.error('Error handling /api/movies/promotions:', error.message);
        res.status(500).send('Server error');
    }
});
// Update promotional price for a movie
app.post('/api/movies/updatePromotionalPrice', async (req, res) => {
    const { movieId, promotionalPrice } = req.body;

    try {
        const result = await movieDB.updatePromotion(movieId, promotionalPrice);
        if (result.success) {
            res.status(200).send(result.message);
        } else {
            res.status(500).send(result.message);
        }
    } catch (error) {
        console.error('Error updating promotional price:', error.message);
        res.status(500).send('Failed to update promotional price.');
    }
});

// Delete promotion from a movie 
app.post('/api/movies/deletePromotion', async (req, res) => {
    const { movieId } = req.body;
    try {
        const result = await movieDB.deletePromotion(movieId);
        if (result.success) {
            res.status(200).json({ message: 'Promotion deleted successfully.' });
        } else {
            res.status(500).json({ message: 'Failed to delete promotion.' });
        }
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ message: 'An error occurred while trying to delete the promotion.' });
    }
});

/** -----------------Movies & Promos--------------------*/
/** ----------------------------------------------------*/
/** ------------------Route Divider---------------------*/
/** ----------------------------------------------------*/
/** -----------------Payment Cards----------------------*/
/* v PAYMENT CARDS v */
// GET payment card(s) for a specific user
app.get('/api/payment-cards/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const cards = await paymentCardDB.fetchUserPaymentCards(id);
        res.json(cards);
    } catch (error) {
        console.error('Failed to fetch payment cards:', error);
        res.status(500).send('Server error while fetching payment cards');
    }
});
// CREATE payment card
app.post('/api/payment-cards', async (req, res) => {
    const { userId, cardNumber, billingAddress, expirationDate } = req.body;

    if (!userId || !cardNumber || !billingAddress || !expirationDate) {
        if (!res.headersSent) {
            return res.status(400).send('Missing required fields');
        }
    }

    try {
        const result = await paymentCardDB.createPaymentCard({ userId, cardNumber, billingAddress, expirationDate });
        if (!res.headersSent) {
            res.status(201).send('Payment card created successfully.');
        }
    } catch (error) {
        console.error('Failed to create payment card:', error);
        if (!res.headersSent) {
            res.status(500).send('Server error while creating payment card: ' + error.message);
        }
    }
}); // Add Card
// delete payment card
app.delete('/api/payment-cards/:cardId', async (req, res) => {
    const { cardId } = req.params;
    try {
        const result = await paymentCardDB.deletePaymentCardById(cardId);
        if (result.affectedRows > 0) {
            res.status(200).send('Payment card deleted successfully.');
        } else {
            res.status(404).send('Payment card not found.');
        }
    } catch (error) {
        console.error('Failed to delete payment card:', error);
        res.status(500).send('Server error while deleting payment card');
    }
}); // delete Payment card
/* ^ PAYMENT CARDS ^ */
/** -----------------Payment Cards----------------------*/
/** ----------------------------------------------------*/
/** ------------------Route Divider---------------------*/
/** ----------------------------------------------------*/
/** -------------------User Shit------------------------*/
/* v USER ROUTES v */
let verificationCodes = {}; // Store verification codes in memory
// delete users ( admin )
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Assuming deleteUserById is a function you implement in userDB that deletes a user by ID
        await userDB.deleteUserById(id);
        res.status(200).send('User deleted successfully.');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Failed to delete user.');
    }
});
// UpdateUser
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const userData = req.body;

    try {
        // Assuming updateUserById is a function you will implement in userDB
        const result = await userDB.updateUserById(id, userData);
        if (result.affectedRows > 0) {
            res.status(200).send('User updated successfully.');
        } else {
            res.status(404).send('User not found.');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('Failed to update user.');
    }
});
// registration
app.post('/user/register', async (req, res) => {
    const { firstName, lastName, phone, email, username, password, creditCard, billingAddress, enablePromotion, type = 2, active = false } = req.body;

    try {
        // Check if email is empty or null
        if (email === '') {
            // Skip email verification process
            const existingUser = await userDB.findUserByUsername(username);
            if (existingUser) {
                return res.status(409).send('An account with the given username already exists.');
            }
            console.log('Admin-created user without email:', { firstName, username, enablePromotion, type });
        } else {
            // Email verification process
            const existingUser = await userDB.findUserByEmailOrUsername(email, username);
            if (existingUser) {
                return res.status(409).send('An account with the given email or username already exists.');
            }

            // Generate a random 6-digit verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000);
            verificationCodes[email] = verificationCode;

            // Send registration email
            const msg = {
                to: email,
                from: 'hunter.mcvay@outlook.com',
                subject: 'Welcome to E-Cinema Booking!',
                html: `
                    <h2>Welcome to E-Cinemma Booking!</h2>
                    <p>Hi ${firstName},</p>
                    <p>Thank you for creating an account with E-Cinemma Booking.</p>
                    <p>Your verification code is: <strong>${verificationCode}</strong></p>
                    <p>If you have any questions, feel free to contact us.</p>
                `,
            };
            await sgMail.send(msg);
        }

        await userDB.createUser({
            firstName,
            lastName,
            phone,
            email,
            username,
            password,
            creditCard,
            billingAddress,
            enablePromotion,
            type,
            active
        });

        console.log("Testing if this line causes an error.");
        res.status(201).send('Account created successfully.');
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).send('An unexpected error occurred. Please try again.');
    }
});
// verifying user after with code generated on reg
app.post('/user/verify', async (req, res) => {
    const { email, username, verificationCode } = req.body;

    try {
        const user = await userDB.findUserByEmailOrUsername(email, username);
        //console.log('Checking verification code:', verificationCode);
        //console.log('Verification code in memory:', verificationCodes[email]);

        if (user) {
            console.log('User found:', user);
            console.log('Checking verification code:', verificationCode);
            console.log('Verification code in memory:', verificationCodes[email]);

            if (verificationCodes.hasOwnProperty(email) && verificationCodes[email].toString() === verificationCode) {

                // Code matches, activate the account
                await userDB.updateUserActiveStatus(email, true); // Mark the user as verified
                delete verificationCodes[email]; // Remove the verification code from memory


                res.status(200).send('Account activated successfully.');
            } else {

                res.status(400).send('Invalid verification code.');
            }
        } else {
            res.status(404).send('User not found.');
        }
    } catch (error) {
        console.error('Error verifying account:', error);
        res.status(500).send('An unexpected error occurred. Please try again.');
    }
});
//get all the users
app.get('/api/users', async (req, res) => {
    console.log('API request for users');
    try {
        const users = await userDB.fetchUserData();
        res.json(users);
    } catch (error) {
        console.error('Error handling /api/users:', error.message);
        res.status(500).send('Server error');
    }
});
 //get specific User by ID
app.get('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await userDB.fetchUserDataById(id);
        if (user) {
            res.json(user);
        } else {
            res.status(404).send('User not found.');
        }
    } catch (error) {
        console.error('Error handling /api/users/:id:', error.message);
        res.status(500).send('Server error');
    }
});
 //For login
app.post('/user/login', async (req, res) => {
    const { username, password } = req.body;

    try {

        const user = await userDB.findUserByUsernameAndPassword(username, password);


        if (!user) {
            console.log('Login attempt failed: User not found or incorrect password');
            //return res.sendStatus(401); // User not found
            return res.status(401).send('Invalid username or password');
        }

        // User found but check if the account is active
        console.log('User active status:', user.active);

        if (user.active === 0) {

            // Generate a random 6-digit verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000);
            verificationCodes[user.email] = verificationCode;

            // Send registration email
            const msg = {
                to: user.email,
                from: 'hunter.mcvay@outlook.com',
                subject: 'E-Cinema Booking Account Activation',
                html: `
                    <h2>E-Cinemma Booking Account Activation</h2>
                    <p>Hi ${user.firstName},</p>
                    <p>Your verification code to activate your account is: <strong>${verificationCode}</strong></p>
                    <p>If you have any questions, feel free to contact us.</p>
                `,
            };
            await sgMail.send(msg);

            return res.status(403).send('Account is not active. Please verify your email.');
        }

        res.json(user);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('An error occurred during the login process. Please try again.');
    }
}); // login
//For password reset
app.post('/user/reset-password', async (req, res) => {
    const { email, username } = req.body;

    if (!email || !username) {
        return res.status(400).send('Email and username are required.');
    }

    try {
        const user = await userDB.findUserByEmailOrUsername(email, username);
        if (!user) {
            return res.status(404).send('User not found.');
        }

        const newPassword = crypto.randomBytes(8).toString('hex'); // Generates an 8-character random hexadecimal string

        await userDB.updatePassword(email, newPassword);


        const msg = {
            to: email,
            from: 'hunter.mcvay@outlook.com',
            subject: 'Password Reset for E-Cinema Booking',
            html: `
                <h2>Password Reset</h2>
                <p>Hi ${user.firstName},</p>
                <p>Your new password is ${newPassword}. Do not share this with anyone and delete this email after saving password.</p>
            `,
        };
        await sgMail.send(msg);

        res.status(200).send('Password reset email sent.');
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).send(`An error occurred: ${error.message}`);
    }
});
/* ^ USER ROUTES ^ */

/** -------------------User Shit------------------------*/
/** ----------------------------------------------------*/
/** ------------------Route Divider---------------------*/
/** ----------------------------------------------------*/
/** ------------------Server Shit-----------------------*/

// Start the server
app.listen(port, () => {
    console.log(`Server index running at http://localhost:${port}`);
    console.log('Booking @ http://localhost:3000/components/Booking/buyTickets.html')
    console.log('HOME PAGE @ http://localhost:3000/components/HomePage/home.html')

    //console.log('Currently testing at http://localhost:3000/components/Registration/registration.html')
});
// Catch-all handler for unhandled requests
app.all('*', (req, res) => {
    console.log('request:', req.method, req.path);
    res.status(404).send('Not Found');
});

app.use(bodyParser.json());

app.use((req, res, next) => {
    console.log('request:', req.method, req.path);
    next();
});
