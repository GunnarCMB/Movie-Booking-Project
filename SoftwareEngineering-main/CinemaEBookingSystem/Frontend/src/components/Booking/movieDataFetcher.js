document.addEventListener("DOMContentLoaded", function() {
    fetchMovies();

    function fetchMovies() {
        fetch('/api/movies')  // Modify this URL to your actual API that returns movie data
            .then(response => response.json())
            .then(movies => {
                const movieGrid = document.getElementById('movieGrid');
                movies.forEach(movie => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = `
                        <img src="${movie.picture_url}" alt="${movie.title}">
                        <h3>${movie.title}</h3>
                        <button onclick="location.href='movie.html?movie_id=${movie.movie_id}'">View/Book Movie</button>
                    `;
                    movieGrid.appendChild(card);
                });
            })
            .catch(error => {
                console.error('Failed to fetch movies:', error);
                movieGrid.innerHTML = '<p>Error loading movies. Please try again later.</p>';
            });
    }
});
