const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const startupSchema = new Schema({
    name: { type: String, required: true, unique: true },
    description: String,
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
}, { timestamps: true });

module.exports = mongoose.model('Startup', startupSchema);