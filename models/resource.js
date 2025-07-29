const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resourceSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    url: { type: String, required: true },
    department: String, // e.g., "Legal", "Marketing", "Tech"
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);