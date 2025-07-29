const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const meetingSchema = new Schema({
    startupName: { type: String, required: true },
    departmentName: { type: String, required: true },
    meetingDate: { type: Date, required: true },
    attendees: String,
    notes: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);