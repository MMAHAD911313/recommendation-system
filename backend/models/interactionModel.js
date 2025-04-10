const mongoose = require("mongoose");

const interactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    interactionType: { type: String, enum: ["dislike", "see_more", "add_to_watch"], required: true },
    interactionCount: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Interaction", interactionSchema);
