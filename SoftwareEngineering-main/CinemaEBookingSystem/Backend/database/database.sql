CREATE DATABASE IF NOT EXISTS CinemaBookingDB;
USE CinemaBookingDB;

DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS showtimes;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS payment_cards;
DROP TABLE IF EXISTS users;

-- movies table --
CREATE TABLE movies (
    movie_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    cast TEXT,
    director VARCHAR(255),
    producer VARCHAR(255),
    synopsis TEXT,
    reviews TEXT,
    trailer_url VARCHAR(255),
    picture_url VARCHAR(255),
    ratingcode VARCHAR(255),
    duration VARCHAR(255),
    rating VARCHAR(255),
    description TEXT,
    bookfee DOUBLE,
    price DOUBLE,
    p_price DOUBLE -- if p_price is null assume movie has no promotions?
);
ALTER TABLE movies MODIFY COLUMN cast TEXT;
ALTER TABLE movies MODIFY COLUMN synopsis TEXT;
ALTER TABLE movies MODIFY COLUMN description TEXT;
ALTER TABLE movies MODIFY COLUMN reviews TEXT;  -- If you decide to change reviews as well


-- showtimes table --
CREATE TABLE showtimes (
    showtime_id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT,
    showtime DATETIME,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id)
);

-- User table --
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    type INT, -- type 1 = admin; type 2 == user --
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    -- credit_card VARCHAR(255) NOT NULL, -- need to remove these without disrupting DB
    -- billing_address VARCHAR(255) NOT NULL, --
    enable_promotion BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT FALSE
);

-- Payment Cards table --
CREATE TABLE payment_cards (
    card_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    card_number VARCHAR(255) NOT NULL,
    billing_address VARCHAR(255) NOT NULL,
    expiration_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Order Table --
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    showtime_id INT NOT NULL,
    card_id INT,
    num_adult_tickets INT DEFAULT 0,
    num_senior_tickets INT DEFAULT 0,
    num_child_tickets INT DEFAULT 0,
    total_tickets INT AS (num_adult_tickets + num_senior_tickets + num_child_tickets) STORED,
    total_price DOUBLE NOT NULL,
    status ENUM('pending', 'confirmed', 'canceled') DEFAULT 'pending',
    payment_date DATETIME,
    movie_title VARCHAR(255), -- Added column for movie title
    showtime_datetime DATETIME, -- Added column for showtime date and time
    seats_chosen TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id),
    FOREIGN KEY (card_id) REFERENCES payment_cards(card_id) ON DELETE SET NULL
);



 -- seats table --
 CREATE TABLE seats (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    showtime_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id)
);



-- for allowing users to be delted that have cards
SELECT CONSTRAINT_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'payment_cards' AND TABLE_SCHEMA = 'CinemaBookingDB';

ALTER TABLE payment_cards DROP FOREIGN KEY payment_cards_ibfk_1;

ALTER TABLE payment_cards
ADD CONSTRAINT payment_cards_ibfk_1
FOREIGN KEY (user_id) REFERENCES users(user_id)
ON DELETE CASCADE;





