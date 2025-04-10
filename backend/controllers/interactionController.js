const Interaction = require("../models/interactionModel");

// Save user interaction
exports.logInteraction = async (req, res) => {
    try {
        const { userId, movieId, interactionType } = req.body;

        if (!userId || !movieId || !interactionType) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if the interaction already exists
        const existingInteraction = await Interaction.findOne({
            userId,
            movieId,
            interactionType
        });

        if (existingInteraction) {
            // If the interaction exists, increment the interactionCount
            existingInteraction.interactionCount += 1;
            await existingInteraction.save();
            return res.status(200).json({ message: "Interaction count updated" });
        }

        // If no existing interaction, create a new one
        const newInteraction = new Interaction({
            userId,
            movieId,
            interactionType,
            interactionCount: 1
        });
        await newInteraction.save();

        res.status(201).json({ message: "Interaction logged successfully" });
    } catch (error) {
        console.error("Error logging interaction:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get interactions for a specific user
exports.getUserInteractions = async (req, res) => {
    try {
        const { userId } = req.params;
        const interactions = await Interaction.find({ userId }).populate("movieId", "title posterUrl");

        res.status(200).json(interactions);
    } catch (error) {
        console.error("Error fetching interactions:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
