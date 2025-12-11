
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
        
        
        const meetings = await Meeting.find({ club: clubId })
            .populate('organizer', 'username displayName') 
            .sort({ dateTime: 1 });

        res.json(meetings);
    } catch (error) {
        res.status(500).json({ error: 'Server error: Could not retrieve meetings.' });
    }
};


exports.getMeetingById = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id)
            .populate('organizer', 'username displayName')
            .populate('attendees', 'username displayName'); // Popula os participantes
        
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
 */
exports.createMeeting = async (req, res) => {
    try {
        const { club, topic, dateTime, location } = req.body;
        
        
        const newMeeting = new Meeting({
            club,
            topic,
            dateTime,
            location,
            organizer: req.user.id 
        });

        await newMeeting.save();
        
        res.status(201).json({ message: 'Meeting scheduled successfully!', meeting: newMeeting });
    } catch (error) {
        res.status(400).json({ error: 'Failed to schedule meeting: ' + error.message });
    }
};

// ----------------------------------
// UPDATE Operation (PUT)
// ----------------------------------

/**
 * Updates an existing meeting by its ID. (PUT /meetings/:id) 
 * Allows updating only by the organizer.
 */
exports.updateMeeting = async (req, res) => {
    try {
        const updateData = req.body;
        
        
        const updatedMeeting = await Meeting.findOneAndUpdate(
            { _id: req.params.id, organizer: req.user.id }, 
            updateData, 
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
// ATTENDEE Operations (POST / PUT)
// ----------------------------------

/**
 * Adds the logged in user as a participant in a meeting. (POST /meetings/:id/attend)
 */
exports.addAttendee = async (req, res) => {
    try {
        const meetingId = req.params.id;
        const userId = req.user.id; // ID do usuário logado

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });

        // Adds the user ID to the 'attendees' array if it is not already there
        if (!meeting.attendees.includes(userId)) {
            meeting.attendees.push(userId);
            await meeting.save();
        }

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