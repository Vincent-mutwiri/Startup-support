const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const deliverableSchema = new Schema({
    name: { type: String, required: true },
    status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
    notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Deliverable', deliverableSchema);