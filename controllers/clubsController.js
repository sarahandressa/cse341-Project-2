
const Club = require('../models/Club');

// ----------------------------------
// READ Operations (GET)
// ----------------------------------

/**
 * Gets a list of all clubs. (GET /clubs)
 */
exports.getAllClubs = async (req, res) => {
    try {
        const clubs = await Club.find();
        res.json(clubs);
    } catch (err) {
        res.status(500).json({ error: 'Server error: Could not retrieve clubs.' });
    }
};

/**
 * Gets a single club by its ID. (GET /clubs/:id)
 */
exports.getClubById = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        res.json(club);
    } catch (err) {
        res.status(500).json({ error: 'Server error: Could not retrieve club.' });
    }
};

// ----------------------------------
// CREATE Operation (POST)
// ----------------------------------

/**
 * Creates a new book club. (POST /clubs) - Requires Authentication
 */
exports.createClub = async (req, res) => {
    try {
        
        const newClub = await Club.create(req.body); 
        res.status(201).json({ message: 'Bookclub created successfully!', club: newClub });
    } catch (err) {
        res.status(400).json({ error: 'Failed to create club: ' + err.message });
    }
};

// ----------------------------------
// UPDATE Operation (PUT)
// ----------------------------------

/**
 * Updates an existing club by its ID. (PUT /clubs/:id) - Requires Authentication
 */
exports.updateClub = async (req, res) => {
    try {
        const updatedClub = await Club.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        
        if (!updatedClub) return res.status(404).json({ error: 'Club not found' });
        
        res.json({ message: 'Club updated successfully', club: updatedClub });
    } catch (err) {
        res.status(400).json({ error: 'Failed to update club: ' + err.message });
    }
};

// ----------------------------------
// DELETE Operation (DELETE)
// ----------------------------------

/**
 * Deletes a club by its ID. (DELETE /clubs/:id) - Requires Authentication
 */
exports.deleteClub = async (req, res) => {
    try {
        const deleted = await Club.findByIdAndDelete(req.params.id);
        
        if (!deleted) return res.status(404).json({ error: 'Club not found' });
        
        res.status(200).json({ message: 'Club deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error: Could not delete club.' });
    }
};