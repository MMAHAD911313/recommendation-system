const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    year: { type: String, required: true },
    runtime: { type: String, required: true },
    genres: { type: [String], required: true },
    director: { type: String, required: true },
    actors: { type: String, required: true },
    plot: { type: String, required: true },
    posterUrl: { type: String, required: true }
}, { timestamps: true });

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;
