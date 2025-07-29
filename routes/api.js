const express = require('express');
const router = express.Router();

// Import all models
const Startup = require('../models/startup');
const Project = require('../models/project');
const Milestone = require('../models/milestone');
const Deliverable = require('../models/deliverable');
const Meeting = require('../models/meeting');
const Resource = require('../models/resource');

// --- HELPER FUNCTION FOR PROGRESS CALCULATION ---
const calculateProgress = (project) => {
    if (!project.milestones || project.milestones.length === 0) {
        return { total: 0, completed: 0, percentage: 0 };
    }

    let totalDeliverables = 0;
    let completedDeliverables = 0;

    project.milestones.forEach(milestone => {
        if (milestone.deliverables && milestone.deliverables.length > 0) {
            totalDeliverables += milestone.deliverables.length;
            milestone.deliverables.forEach(deliverable => {
                if (deliverable.status === 'Completed') {
                    completedDeliverables++;
                }
            });
        }
    });

    const percentage = totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0;
    return { total: totalDeliverables, completed: completedDeliverables, percentage };
};


// --- STARTUP & PROGRESS ROUTES ---

// GET all startups with their projects and calculated progress
router.get('/startups/progress', async (req, res) => {
    try {
        const startups = await Startup.find().populate({
            path: 'projects',
            populate: {
                path: 'milestones',
                populate: {
                    path: 'deliverables'
                }
            }
        });

        const startupsWithProgress = startups.map(startup => {
            const projectsWithProgress = startup.projects.map(project => {
                const progress = calculateProgress(project);
                return {
                    ...project.toObject(),
                    progress,
                };
            });
            return {
                ...startup.toObject(),
                projects: projectsWithProgress,
            };
        });

        res.json(startupsWithProgress);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST to update progress for a startup's project
router.post('/startups/progress', async (req, res) => {
    try {
        const { startupId, projectId, milestoneId, deliverableId, status } = req.body;
        
        // Validate required fields
        if (!startupId || !projectId || !milestoneId || !deliverableId || !status) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Find the startup
        const startup = await Startup.findById(startupId);
        if (!startup) {
            return res.status(404).json({ message: 'Startup not found' });
        }

        // Find the project
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Find and update the deliverable status
        const milestone = await Milestone.findById(milestoneId);
        if (!milestone) {
            return res.status(404).json({ message: 'Milestone not found' });
        }

        const deliverableIndex = milestone.deliverables.findIndex(d => d._id.toString() === deliverableId);
        if (deliverableIndex === -1) {
            return res.status(404).json({ message: 'Deliverable not found' });
        }

        // Update the deliverable status
        milestone.deliverables[deliverableIndex].status = status;
        milestone.markModified('deliverables');
        await milestone.save();

        // Return the updated project with progress
        const updatedProject = await Project.findById(projectId)
            .populate({
                path: 'milestones',
                populate: {
                    path: 'deliverables'
                }
            });

        const progress = calculateProgress(updatedProject);
        
        res.json({
            message: 'Progress updated successfully',
            project: {
                ...updatedProject.toObject(),
                progress
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- MEETING ROUTES ---

// POST a new meeting
router.post('/meetings', async (req, res) => {
    const meeting = new Meeting({
        startupName: req.body.startupName,
        departmentName: req.body.departmentName,
        meetingDate: req.body.meetingDate,
        attendees: req.body.attendees,
        notes: req.body.notes,
    });
    try {
        const newMeeting = await meeting.save();
        res.status(201).json(newMeeting);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET all meetings
router.get('/meetings', async (req, res) => {
    try {
        const meetings = await Meeting.find().sort({ meetingDate: -1 });
        res.json(meetings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// --- PROJECT ROUTES ---

// POST a new project
router.post('/projects', async (req, res) => {
    const { name, description, startupId } = req.body;
    
    // Validate required fields
    if (!name || !startupId) {
        return res.status(400).json({ message: 'Name and startupId are required' });
    }

    try {
        // Validate startupId format
        if (!mongoose.Types.ObjectId.isValid(startupId)) {
            return res.status(400).json({ message: 'Invalid startup ID format' });
        }

        // Check if startup exists
        const startup = await Startup.findById(startupId);
        if (!startup) {
            return res.status(404).json({ message: 'Startup not found' });
        }

        // Create the project
        const project = new Project({ name, description });
        const savedProject = await project.save();
        
        // Add project to startup's projects array
        startup.projects.push(savedProject._id);
        await startup.save();
        
        res.status(201).json(savedProject);
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// --- MILESTONE ROUTES ---

// POST a new milestone
router.post('/milestones', async (req, res) => {
    const { name, dueDate, projectId } = req.body;
    
    // Validate required fields
    if (!name || !projectId) {
        return res.status(400).json({ message: 'Name and projectId are required' });
    }

    try {
        // Validate projectId format
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: 'Invalid project ID format' });
        }

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Create the milestone
        const milestone = new Milestone({ 
            name, 
            dueDate: dueDate ? new Date(dueDate) : undefined 
        });
        const savedMilestone = await milestone.save();
        
        // Add milestone to project's milestones array
        project.milestones.push(savedMilestone._id);
        await project.save();
        
        res.status(201).json(savedMilestone);
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// --- DELIVERABLE ROUTES ---

// POST a new deliverable
router.post('/deliverables', async (req, res) => {
    const { name, status, notes, milestoneId } = req.body;
    
    // Validate required fields
    if (!name || !milestoneId) {
        return res.status(400).json({ message: 'Name and milestoneId are required' });
    }

    try {
        // Validate milestoneId format
        if (!mongoose.Types.ObjectId.isValid(milestoneId)) {
            return res.status(400).json({ message: 'Invalid milestone ID format' });
        }

        // Check if milestone exists
        const milestone = await Milestone.findById(milestoneId);
        if (!milestone) {
            return res.status(404).json({ message: 'Milestone not found' });
        }

        // Create the deliverable
        const deliverable = new Deliverable({ 
            name, 
            status: status || 'Not Started',
            notes
        });
        const savedDeliverable = await deliverable.save();
        
        // Add deliverable to milestone's deliverables array
        milestone.deliverables.push(savedDeliverable._id);
        await milestone.save();
        
        res.status(201).json(savedDeliverable);
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// --- RESOURCE ROUTES ---

// POST a new resource
router.post('/resources', async (req, res) => {
    const resource = new Resource({
        name: req.body.name,
        description: req.body.description,
        url: req.body.url,
        department: req.body.department,
    });
    try {
        const newResource = await resource.save();
        res.status(201).json(newResource);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET all resources
router.get('/resources', async (req, res) => {
    try {
        const resources = await Resource.find().sort({ department: 1, name: 1 });
        res.json(resources);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// You can add more specific GET, POST, PATCH, DELETE routes for each model as needed
// For example, to create a new startup:
router.post('/startups', async (req, res) => {
    const startup = new Startup({ name: req.body.name, description: req.body.description });
    try {
        const newStartup = await startup.save();
        res.status(201).json(newStartup);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


module.exports = router;