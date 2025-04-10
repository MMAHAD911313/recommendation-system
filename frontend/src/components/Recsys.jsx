import React, { useEffect, useState } from 'react';

export default function Recsys() {
    const [users, setUsers] = useState([]);
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState(localStorage.getItem('userId') || null);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMovie, setSelectedMovie] = useState(null);

    // Fetch users on initial load
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/users');
                if (!response.ok) throw new Error('Failed to fetch users');
                const data = await response.json();
                setUsers(data);

                // Set default user if none is selected
                if (!selectedUser && data.length > 0) {
                    setSelectedUser(data[0]._id);
                    localStorage.setItem('userId', data[0]._id);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                setError('Failed to load users. Please try again later.');
            }
        };

        fetchUsers();
    }, []);

    // Fetch movies with pagination & search term
    useEffect(() => {
        const fetchMovies = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `http://localhost:5000/api/movies?userId=${selectedUser}&page=${page}&limit=5&term=${searchTerm}`
                );
                if (!response.ok) throw new Error('Failed to fetch movies');
                const data = await response.json();
                setMovies(page === 1 ? data.movies : [...movies, ...data.movies]);
                setTotalPages(data.totalPages);
            } catch (error) {
                console.error('Error fetching movies:', error);
                setError('Failed to load movies. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, [page, searchTerm, selectedUser]);

    // Handle scroll event for lazy loading
    const handleScroll = (e) => {
        if (loading || page >= totalPages) return;
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            setPage((prevPage) => prevPage + 1);
        }
    };

    // Handle user selection
    const handleUserSelect = (e) => {
        const userId = e.target.value;
        setSelectedUser(userId);
        localStorage.setItem('userId', userId);
        setPage(1);  // Reset the page when a new user is selected
    };

    // Handle search input
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    // Log interaction
    const logInteraction = async (movieId, interactionType) => {
        try {
            const response = await fetch('http://localhost:5000/api/interactions/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: selectedUser,
                    movieId,
                    interactionType,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to log interaction');
            }
        } catch (error) {
            console.error('Error logging interaction:', error);
        }
    };

    // Handle "See More" click
    const handleSeeMore = (movieId) => {
        logInteraction(movieId, 'see_more');
    };

    // Handle "Add to Watch" click
    const handleAddToWatch = (movieId) => {
        logInteraction(movieId, 'add_to_watch');
    };

    // Handle "Dislike" click
    const handleDislike = (movieId) => {
        logInteraction(movieId, 'dislike');
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 relative">
            {/* User Selection & Search Bar */}
            <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-md flex gap-4">
                <select
                    className="w-1/2 p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={handleUserSelect}
                    value={selectedUser || ''}
                >
                    {users.map((user) => (
                        <option key={user._id} value={user._id}>
                            {user.name}
                        </option>
                    ))}
                </select>

                <input
                    type="text"
                    placeholder="Search movies..."
                    className="w-1/2 p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>

            {/* Movies Section */}
            <div
                className="max-w-4xl mx-auto mt-4 overflow-y-auto"
                style={{ maxHeight: '70vh' }}
                onScroll={handleScroll}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
                    {movies.map((movie) => (
                        <div
                            key={movie._id}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                            onClick={() => setSelectedMovie(movie)}
                        >
                            <img
                                src={movie.posterUrl || 'https://via.placeholder.com/150'}
                                alt={movie.title}
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-4">
                                <h4 className="text-lg font-semibold">{movie.title}</h4>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Movie Popup */}
            {selectedMovie && (
                <div className="fixed inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full relative">
                        <button
                            className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded"
                            onClick={() => setSelectedMovie(null)}
                        >
                            ✕
                        </button>
                        <img
                            src={selectedMovie.posterUrl || 'https://via.placeholder.com/300'}
                            alt={selectedMovie.title}
                            className="w-full h-64 object-cover rounded-md"
                        />
                        <h2 className="text-2xl font-bold text-center mt-4">{selectedMovie.title}</h2>
                        <button
                            className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg"
                            onClick={() => handleSeeMore(selectedMovie._id)}
                        >
                            See More
                        </button>
                        <button
                            className="mt-2 w-full bg-green-500 text-white py-2 rounded-lg"
                            onClick={() => handleAddToWatch(selectedMovie._id)}
                        >
                            Add to Watch
                        </button>
                        {/* Dislike Button */}
                        {/* <button
                            className="mt-2 w-full bg-red-500 text-white py-2 rounded-lg"
                            onClick={() => handleDislike(selectedMovie._id)}
                        >
                            Dislike
                        </button> */}
                    </div>
                </div>
            )}
        </div>
    );
}
