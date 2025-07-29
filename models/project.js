const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    milestones: [{ type: Schema.Types.ObjectId, ref: 'Milestone' }],
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);