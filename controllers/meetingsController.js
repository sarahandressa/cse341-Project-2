const Meeting = require('../models/Meeting');
const Club = require('../models/Club'); 

// ----------------------------------
// READ Operations (GET)
// ----------------------------------

/**
 * Gets all scheduled meetings for a specific club (GET /meetings/club/:clubId)
 */
exports.getMeetingsByClubId = async (req, res) => {
    try {
        const { clubId } = req.params;
        
        // Note: Mongoose field is 'club', which matches the parameter name 'clubId'
        // in the URL route, simplifying the find query here.
        const meetings = await Meeting.find({ club: clubId })
            .populate('organizer', 'username displayName') 
            .sort({ dateTime: 1 });

        res.json(meetings);
    } catch (error) {
        // In a real application, you might use 'next(error)'
        res.status(500).json({ error: 'Server error: Could not retrieve meetings.' });
    }
};


exports.getMeetingById = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id)
            .populate('organizer', 'username displayName')
            .populate('attendees', 'username displayName'); 
        
        if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
        res.json(meeting);
    } catch (error) {
        res.status(500).json({ error: 'Server error: Could not retrieve meeting.' });
    }
};

// ----------------------------------
// CREATE Operation (POST)
// ----------------------------------

/**
 * Schedule a new meeting. (POST /meetings) 
 * Maps clubId -> club and agenda -> topic from the request body.
 */
exports.createMeeting = async (req, res) => {
    try {
        // --- DATA MAPPING: Renames fields to match Mongoose Schema ---
        const { 
            clubId: club,     // clubId from request body maps to 'club' for Mongoose
            agenda: topic,    // agenda from request body maps to 'topic' for Mongoose
            dateTime, 
            location 
        } = req.body;
        
        // Ensure user is authenticated and ID is available
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Authentication required to schedule a meeting.' });
        }
        
        const newMeeting = new Meeting({
            club,             // Uses the mapped 'club' value
            topic,            // Uses the mapped 'topic' value
            dateTime,
            location,
            organizer: req.user.id // Takes the ID from the authenticated user
        });

        await newMeeting.save();
        
        res.status(201).json({ message: 'Meeting scheduled successfully!', meeting: newMeeting });
    } catch (error) {
        // Use error.message for more specific validation failure feedback
        res.status(400).json({ error: 'Failed to schedule meeting: ' + error.message });
    }
};

// ----------------------------------
// UPDATE Operation (PUT)
// ----------------------------------

/**
 * Updates an existing meeting by its ID. (PUT /meetings/:id) 
 * Allows updating only by the organizer. Maps fields before update.
 */
exports.updateMeeting = async (req, res) => {
    try {
        const reqBody = req.body;
        const mappedUpdateData = {};

        // --- DATA MAPPING: Map client names to Mongoose names ---
        if (reqBody.clubId) {
            mappedUpdateData.club = reqBody.clubId;
        }
        if (reqBody.agenda) {
            mappedUpdateData.topic = reqBody.agenda;
        }
        
        // Add all other fields directly (dateTime, location, status, attendees, etc.)
        Object.assign(mappedUpdateData, reqBody);

        // Remove client-specific names if they still exist after being mapped/used
        delete mappedUpdateData.clubId;
        delete mappedUpdateData.agenda;
        
        // The update query finds the document by ID AND confirms the organizer is the logged-in user
        const updatedMeeting = await Meeting.findOneAndUpdate(
            { _id: req.params.id, organizer: req.user.id }, 
            mappedUpdateData, // Use the mapped and cleaned data
            { new: true, runValidators: true }
        );
        
        if (!updatedMeeting) {
            const existingMeeting = await Meeting.findById(req.params.id);
            if (!existingMeeting) return res.status(404).json({ error: 'Meeting not found.' });
            
            return res.status(403).json({ error: 'Forbidden: You can only edit meetings you organized.' });
        }
        
        res.json({ message: 'Meeting updated successfully', meeting: updatedMeeting });
    } catch (error) {
        res.status(400).json({ error: 'Failed to update meeting: ' + error.message });
    }
};

// ----------------------------------
// DELETE Operation (DELETE)
// ----------------------------------

/**
 * Cancel/Delete a meeting by its ID. (DELETE /meetings/:id) 
 * Allows deletion only by the organizer.
 */
exports.deleteMeeting = async (req, res) => {
    try {
        // Query to find and delete only if the organizer matches the logged-in user
        const deleted = await Meeting.findOneAndDelete({ _id: req.params.id, organizer: req.user.id });
        
        if (!deleted) {
            const existingMeeting = await Meeting.findById(req.params.id);
            if (!existingMeeting) return res.status(404).json({ error: 'Meeting not found.' });
            return res.status(403).json({ error: 'Forbidden: You can only delete meetings you organized.' });
        }
        
        res.status(200).json({ message: 'Meeting deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error: Could not delete meeting.' });
    }
};

// ----------------------------------
// ATTENDEE Operations (POST / DELETE)
// ----------------------------------

/**
 * Adds the logged in user as a participant in a meeting. (POST /meetings/:id/attend)
 */
exports.addAttendee = async (req, res) => {
    try {
        const meetingId = req.params.id;
        // Ensure user ID is correctly accessed from the authentication middleware
        const userId = req.user.id; 

        // Find and update the meeting to push the user ID into the attendees array
        const meeting = await Meeting.findByIdAndUpdate(
            meetingId,
            { $addToSet: { attendees: userId } }, // $addToSet prevents duplicates
            { new: true }
        );

        if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
        
        res.status(200).json({ message: 'Successfully added to meeting attendees.', meeting });
    } catch (error) {
        res.status(500).json({ error: 'Server error: Could not register attendance.' });
    }
};

/**
 * Removes the logged in user from the participant list. (DELETE /meetings/:id/attend)
 */
exports.removeAttendee = async (req, res) => {
    try {
        const meetingId = req.params.id;
        const userId = req.user.id; 

        // Find and update the meeting to pull the user ID from the attendees array
        const meeting = await Meeting.findByIdAndUpdate(
            meetingId,
            { $pull: { attendees: userId } }, 
            { new: true }
        );

        if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });

        res.status(200).json({ message: 'Successfully removed from meeting attendees.', meeting });
    } catch (error) {
        res.status(500).json({ error: 'Server error: Could not remove attendance.' });
    }
};