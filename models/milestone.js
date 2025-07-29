const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const milestoneSchema = new Schema({
    name: { type: String, required: true },
    dueDate: Date,
    deliverables: [{ type: Schema.Types.ObjectId, ref: 'Deliverable' }],
}, { timestamps: true });

module.exports = mongoose.model('Milestone', milestoneSchema);