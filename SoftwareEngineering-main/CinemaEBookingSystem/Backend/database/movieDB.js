//movieDB.js

const pool = require('./databasePool');
console.log('Successfully connected to the movie database.');

async function fetchMovieData() {
    try {
        const [movies] = await pool.query(`
            SELECT *
            FROM movies
        `);
        return movies;
    } catch (error) {
        console.error('An error occurred:', error);
        return [];
    }
}

async function fetchMovieById(id) {
    try {
        const [movies] = await pool.query(`
            SELECT *
            FROM movies
            WHERE movie_id = ?
            `, [id]);
        return movies.length > 0 ? movies[0] : null;
    } catch (error) {
        console.error('An error occurred:', error);
        return null;
    }
}

async function deleteMovieById(id) {
    try {
        await pool.query('START TRANSACTION');
        await pool.query('DELETE FROM showtimes WHERE movie_id = ?', [id]);
        const [result] = await pool.query('DELETE FROM movies WHERE movie_id = ?', [id]);
        await pool.query('COMMIT');
        return result;
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error deleting movie:', error);
        throw error;
    }
}

async function updateMovieById(id, movieData) {
    try {
        const result = await pool.query(`
            UPDATE movies
            SET title = ?, category = ?, cast = ?, director = ?, producer = ?, synopsis = ?, reviews = ?, trailer_url = ?, picture_url = ?, ratingcode = ?, duration = ?, rating = ?, description = ?, bookfee = ?, price = ?, p_price = ?
            WHERE movie_id = ?
        `, [
            movieData.title,
            movieData.category,
            movieData.cast,
            movieData.director,
            movieData.producer,
            movieData.synopsis,
            movieData.reviews,
            movieData.trailer_url,
            movieData.picture_url,
            movieData.ratingcode,
            movieData.duration,
            movieData.rating,
            movieData.description,
            movieData.bookfee,
            movieData.price,
            movieData.p_price,
            id
        ]);
        return { message: 'Movie updated successfully.' };
    } catch (error) {
        console.error('Error updating movie:', error);
        throw error;
    }
}

async function createMovie(movieData) {
    try {
        const [result] = await pool.query(`
            INSERT INTO movies (title, category, cast, director, producer, synopsis, reviews, trailer_url, picture_url, ratingcode, duration, rating, description, bookfee, price, p_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            movieData.title,
            movieData.category,
            movieData.cast,
            movieData.director,
            movieData.producer,
            movieData.synopsis,
            movieData.reviews,
            movieData.trailer_url,
            movieData.picture_url,
            movieData.ratingcode,
            movieData.duration,
            movieData.rating,
            movieData.description || 'No description available',
            movieData.bookfee,
            movieData.price,
            movieData.p_price
        ]);
        return result.insertId;
    } catch (error) {
        console.error('An error occurred while creating movie:', error);
        throw error;
    }
}

// Update a promotion
async function updatePromotion(movieId, promotionalPrice) {
    try {
        const query = `
            UPDATE movies
            SET p_price = ?
            WHERE movie_id = ?;
        `;
        const params = [promotionalPrice, movieId];

        await pool.query(query, params);
        return { success: true, message: 'Promotional price updated successfully.' };
    } catch (error) {
        console.error('Error updating promotional price:', error.message);
        return { success: false, message: 'Failed to update promotional price.' };
    }
}

// Delete a promotion
async function deletePromotion(movieId) {
    try {
        const query = `
            UPDATE movies
            SET p_price = NULL
            WHERE movie_id = ?;
        `;
        const params = [movieId];

        await pool.query(query, params);
        return { success: true, message: 'Promotional price deleted successfully.' };
    } catch (error) {
        console.error('Error deleting promotional price:', error.message);
        return { success: false, message: 'Failed to delete promotional price.' };
    }
}

// Fetch promoted movies
async function fetchPromotedMovies() {
    try {
        const [promotedMovies] = await pool.query(`
            SELECT *
            FROM movies
            WHERE p_price IS NOT NULL; -- Select only movies with promotional prices
        `);
        console.log('Retrieved promoted movies:', promotedMovies); // Log the fetched movies
        return promotedMovies;
    } catch (error) {
        console.error('An error occurred while fetching promoted movies:', error);
        return [];
    }
}

/** ---------------------Movies-------------------------*/
/** ----------------------------------------------------*/
/** ------------------Route Divider---------------------*/
/** ----------------------------------------------------*/
/** -------------------Showtimes------------------------*/

// fetch showtime by id
async function fetchShowtimeById(showtimeId) {
    try {
        const [result] = await pool.query('SELECT * FROM showtimes WHERE showtime_id = ?', [showtimeId]);
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Error fetching showtime by ID:', error);
        throw error;
    }
}

async function fetchShowtimesByMovieId(movieId) {
    try {
        const [showtimes] = await pool.query(`
            SELECT * FROM showtimes WHERE movie_id = ?
        `, [movieId]);
        return showtimes;
    } catch (error) {
        console.error('Error fetching showtimes:', error);
        throw error;
    }
}

// create Shwotime
async function createShowtime(movieId, showtime) {
    try {
        const [result] = await pool.query(`
            INSERT INTO showtimes (movie_id, showtime)
            VALUES (?, ?)
        `, [movieId, showtime]);
        return result.insertId;
    } catch (error) {
        console.error('Error creating showtime:', error);
        throw error;
    }
}

// delete Showtime
async function deleteShowtime(showtimeId) {
    try {
        const [result] = await pool.query('DELETE FROM showtimes WHERE showtime_id = ?', [showtimeId]);
        return result;
    } catch (error) {
        console.error('Error deleting showtime:', error);
        throw error;
    }
}
/* showtimes */

module.exports = {
    fetchMovieData,
    deleteMovieById,
    updateMovieById,
    fetchMovieById,
    createMovie,
    updatePromotion,
    deletePromotion,
    fetchPromotedMovies,
    createShowtime,
    fetchShowtimesByMovieId,
    fetchShowtimeById,
    deleteShowtime

};
