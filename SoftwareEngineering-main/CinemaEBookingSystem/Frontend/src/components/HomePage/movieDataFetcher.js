document.addEventListener("DOMContentLoaded", function () {
    fetchMovies();

    async function fetchMovies() {
        try {
            const response = await fetch('/api/movies'); // Modify this URL to your actual API that returns movie data
            if (!response.ok) {
                throw new Error('Failed to fetch movies');
            }
            const movies = await response.json();

            const movieGrid = document.getElementById('movieGrid');

            // Create an array of promises to fetch showtimes for each movie
            const showtimesPromises = movies.map(movie => getShowtimesHTML(movie.movie_id));

            // Wait for all showtimes to be fetched
            const showtimesArray = await Promise.all(showtimesPromises);

            // Iterate over movies and showtimes to create card elements
            movies.forEach((movie, index) => {
                const card = document.createElement('div');
                card.className = 'card';
                card.id = movie.movie_id; // Set the id of the card to the movie_id
                card.innerHTML = `
                    <img src="${movie.picture_url}" alt="${movie.title}">
                    <h3>${movie.title}</h3>
                    <h5>${movie.category}<h5>
                    <p>${movie.synopsis}</p>
                    <p>${showtimesArray[index]}</p>
                `;
                movieGrid.appendChild(card);
            });
        } catch (error) {
            console.error('Failed to fetch movies:', error);
            movieGrid.innerHTML = '<p>Error loading movies. Please try again later.</p>';
        }
    }

    async function getShowtimesHTML(movieId) {
        try {
            const response = await fetch(`/api/showtimes/${movieId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch showtimes');
            }
            const showtimes = await response.json();
            return showtimes.map(showtime => new Date(showtime.showtime).toLocaleString()).join('<br>');
        } catch (error) {
            console.error('Error:', error);
            return 'No showtimes available';
        }
    }

});

