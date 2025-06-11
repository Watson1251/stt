const Segment = require("../models/segment.model");

exports.getSegments = async (req, res) => {
    try {
        const segments = await Segment.find();
        res.status(200).json({
            message: "Segments fetched successfully!",
            segments,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Fetching segments failed!" });
    }
};

exports.getSegment = async (req, res) => {
    try {
        const segment = await Segment.findById(req.params.id);
        if (segment) {
            res.status(200).json(segment);
        } else {
            res.status(404).json({ message: "Segment not found!" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Fetching segment failed!" });
    }
};

exports.createSegment = async (req, res) => {
    const {
        path,
        start,
        end,
        status,
        text = "",
        suggestions = [],
        editedText = "",
    } = req.body;

    const segment = new Segment({
        path,
        start,
        end,
        status,
        text,
        suggestions,
        editedText,
    });

    try {
        const createdSegment = await segment.save();
        res.status(201).json({
            message: "Segment created successfully",
            segment: createdSegment,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Creating segment failed!" });
    }
};

exports.updateSegment = async (req, res) => {
    const {
        path,
        start,
        end,
        status,
        text = "",
        suggestions = [],
        editedText = "",
    } = req.body;

    try {
        const updatedSegment = await Segment.findByIdAndUpdate(
            req.params.id,
            {
                path,
                start,
                end,
                status,
                text,
                suggestions,
                editedText,
            },
            { new: true }
        );

        if (updatedSegment) {
            res.status(200).json({
                message: "Segment updated successfully",
                segment: updatedSegment,
            });
        } else {
            res.status(404).json({ message: "Segment not found!" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Updating segment failed!" });
    }
};

exports.deleteSegment = async (req, res) => {
    try {
        const result = await Segment.findByIdAndDelete(req.params.id);
        if (result) {
            res.status(200).json({ message: "Segment deleted successfully!" });
        } else {
            res.status(404).json({ message: "Segment not found!" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Deleting segment failed!" });
    }
};
