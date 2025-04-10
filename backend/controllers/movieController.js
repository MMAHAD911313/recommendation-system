const Interaction = require('../models/interactionModel');
const Movie = require('../models/movieModel');

// Get all movies
exports.getAllMovies = async (req, res) => {
    try {
        let { page = 1, limit = 5, term = "", userId = null } = req.query; // Accept userId from query params
        page = parseInt(page);
        limit = parseInt(limit);

        const query = {};

        if (term) {
            const regex = new RegExp(term, "i"); // Case-insensitive search
            query.$or = [
                { title: regex },
                { year: regex },
                { runtime: regex },
                { genres: regex },
                { director: regex },
                { actors: regex },
                { plot: regex },
            ];
        }

        let interaction;

        if (userId) {
            interaction = await Interaction.find({
                userId: userId
            });
        }

        // If userId is provided (i.e., the user is logged in)
        if (userId && interaction.length > 0) {
            // Fetch user interactions
            const interactions = await Interaction.find({ userId });

            let interactionScores = {};

            interactions.forEach((interaction) => {
                let movieId = interaction.movieId.toString();
                let interactionWeight = 0;

                switch (interaction.interactionType) {
                    case "see_more":
                        interactionWeight = 1;
                        break;
                    case "add_to_watch":
                        interactionWeight = 2;
                        break;
                    case "dislike":
                        interactionWeight = -1;
                        break;
                }

                if (!interactionScores[movieId]) {
                    interactionScores[movieId] = 0;
                }

                interactionScores[movieId] += interaction.interactionCount * interactionWeight;
            });

            // Sort movies by interaction score
            const sortedMovies = Object.entries(interactionScores)
                .sort((a, b) => b[1] - a[1])
                .map((entry) => entry[0]);

            // Fetch movie details based on sorted movieIds
            const recommendedMovies = await Movie.find({
                _id: { $in: sortedMovies },
            });

            // Content-based filtering: Get recommendations for similar movies based on interactions
            let allMovies = await Movie.find({}); // Get all movies
            let contentBasedRecommendations = [];

            recommendedMovies.forEach((movie) => {
                const similarMovies = getContentBasedRecommendations(movie, allMovies);
                contentBasedRecommendations = [
                    ...contentBasedRecommendations,
                    ...similarMovies,
                ];
            });

            // Remove duplicates and merge the lists
            const mergedMovies = [...recommendedMovies, ...contentBasedRecommendations];
            const uniqueMovies = Array.from(
                new Set(mergedMovies.map((a) => a._id.toString()))
            ).map((id) =>
                mergedMovies.find((a) => a._id.toString() === id)
            );

            // Apply pagination to merged and unique movie list
            const paginatedMovies = uniqueMovies.slice(
                (page - 1) * limit,
                page * limit
            );

            res.status(200).json({
                totalMovies: uniqueMovies.length,
                totalPages: Math.ceil(uniqueMovies.length / limit),
                currentPage: page,
                movies: paginatedMovies,
            });
        } else {
            // If no userId is provided, just return movies based on search term
            const totalMovies = await Movie.countDocuments(query);
            const movies = await Movie.find(query)
                .skip((page - 1) * limit)
                .limit(limit);

            res.status(200).json({
                totalMovies,
                totalPages: Math.ceil(totalMovies / limit),
                currentPage: page,
                movies,
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error", error });
    }
};

// Content-based recommendation logic (can be moved to a separate utility file if needed)
const getContentBasedRecommendations = (movie, allMovies) => {
    let similarMovies = [];

    allMovies.forEach((otherMovie) => {
        if (otherMovie._id.toString() === movie._id.toString()) return;

        let score = 0;

        // Genre similarity
        const genreMatch = movie.genres.some((genre) =>
            otherMovie.genres.includes(genre)
        );
        if (genreMatch) score += 1;

        // Director similarity
        if (movie.director === otherMovie.director) score += 1;

        // Actor similarity
        const actorMatch = movie.actors
            .split(", ")
            .some((actor) => otherMovie.actors.split(", ").includes(actor));
        if (actorMatch) score += 1;

        if (score > 0) {
            similarMovies.push({
                movie: otherMovie,
                score: score,
            });
        }
    });

    // Sort similar movies by score in descending order
    similarMovies.sort((a, b) => b.score - a.score);

    return similarMovies.map((item) => item.movie);
};

// Get a single movie by ID
exports.getMovieById = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        res.status(200).json(movie);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Create a new movie
exports.createMovie = async (req, res) => {
    try {
        const newMovie = new Movie(req.body);
        await newMovie.save();
        res.status(201).json(newMovie);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data', error });
    }
};

// Update a movie by ID
exports.updateMovie = async (req, res) => {
    try {
        const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedMovie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        res.status(200).json(updatedMovie);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Delete a movie by ID
exports.deleteMovie = async (req, res) => {
    try {
        const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
        if (!deletedMovie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        res.status(200).json({ message: 'Movie deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
