const express = require('express');
const AdminService = require('../services/admin_service');
const Constants = require('../utils/Constants/response_messages')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const multer = require("multer");
const jwtHelperObj = new JwtHelper();
const router = express.Router()
const https = require('https');


router.get('/convert-image-to-base64', (req, res) => {
    // The URL of the image is expected to be provided as a query parameter
    const imageUrl = req.query.url;

    if (!imageUrl) {
        return res.status(400).json({
            status: 'error',
            message: 'Image URL is required',
        });
    }

    // Function to extract the file extension from the URL
    function getFileExtension(imageUrl) {
        // Find the last dot in the URL
        const lastDotIndex = imageUrl.lastIndexOf('.');

        // Slice everything after the last dot to get the extension
        const extension = imageUrl.slice(lastDotIndex + 1);

        return extension;
    }

    // Get the file extension
    const fileExtension = getFileExtension(imageUrl);

    https.get(imageUrl, (response) => {
        // Array to hold the chunks of data as they are being received
        const chunks = [];
        response.on('data', (chunk) => {
            chunks.push(chunk);
        });

        // Combine all the data chunks into a single Buffer when the response ends
        response.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const base64Image = buffer.toString('base64');
            res.status(200).json({
                status: 'success',
                base64Image: `data:image/${fileExtension};base64,${base64Image}`,
            });
        });
    }).on('error', (e) => {
        res.status(500).json({
            status: 'error',
            message: `Failed to convert image: ${e.message}`,
        });
    });
});

router.post('/createSuperAdmin', multer().any(), async (req, res, next) => {
    try {
        const adminServiceObj = new AdminService();
        await adminServiceObj.createSuperAdmin(req.body, req.files);
        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
        });
    } catch (err) {
        // Check if the error is an instance of HTTP Errors
        if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
            return res.status(err.statusCode).send({ "status": err.statusCode, "message": err.message });
        }
        // For other errors, use a generic server error response
        return res.status(500).send({ "status": 500, "message": "Internal Server Error" });
    }
});


router.get('/getUsersList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const adminServiceObj = new AdminService();
            const data = await adminServiceObj.getUsersList();

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        }
        else {
            res.send({
                "status": 401,
                "message": "only Super Admin has access to get users the data",
            })
        }
    } catch (err) {
        // Check if the error is an instance of HTTP Errors
        if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
            return res.status(err.statusCode).send({ "status": err.statusCode, "message": err.message });
        }
        // For other errors, use a generic server error response
        return res.status(500).send({ "status": 500, "message": "Internal Server Error" });
    }
})

router.get('/getAllSurveyorNames', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const adminServiceObj = new AdminService();
            const data = await adminServiceObj.getAllSurveyorNames();

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        }
        else {
            res.send({
                "status": 401,
                "message": "only Super Admin has access to get users the data",
            })
        }
    } catch (err) {
        // Check if the error is an instance of HTTP Errors
        if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
            return res.status(err.statusCode).send({ "status": err.statusCode, "message": err.message });
        }
        // For other errors, use a generic server error response
        return res.status(500).send({ "status": 500, "message": "Internal Server Error" });
    }
})

router.get('/getAllSurveyorDetails', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const adminServiceObj = new AdminService();
            const data = await adminServiceObj.getAllSurveyorDetails();

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        }
        else {
            res.send({
                "status": 401,
                "message": "only Super Admin has access to getAllSurveyorDetails",
            })
        }
    } catch (err) {
        // Check if the error is an instance of HTTP Errors
        if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
            return res.status(err.statusCode).send({ "status": err.statusCode, "message": err.message });
        }
        // For other errors, use a generic server error response
        return res.status(500).send({ "status": 500, "message": "Internal Server Error" });
    }
})

router.put('/surveyorUpdate/:surveyor_id', jwtHelperObj.verifyAccessToken, multer().any(), async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const surveyor_id = req.params.surveyor_id;
            const adminServiceObj = new AdminService();
            const data = await adminServiceObj.surveyorUpdate(surveyor_id, req.body, req.files);
            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN has access to Edit surveyor",
            })
        }
    } catch (err) {
        // Check if the error is an instance of HTTP Errors
        if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
            return res.status(err.statusCode).send({ "status": err.statusCode, "message": err.message });
        }
        // For other errors, use a generic server error response
        return res.status(500).send({ "status": 500, "message": "Internal Server Error" });
    }
})

router.delete('/deleteSurveyor/:surveyor_id', jwtHelperObj.verifyAccessToken, multer().any(), async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const surveyor_id = req.params.surveyor_id;
            const adminServiceObj = new AdminService();
            const data = await adminServiceObj.deleteSurveyor(surveyor_id);
            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN has access to delete Surveyor",
            })
        }
    } catch (err) {
        // Check if the error is an instance of HTTP Errors
        if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
            return res.status(err.statusCode).send({ "status": err.statusCode, "message": err.message });
        }
        // For other errors, use a generic server error response
        return res.status(500).send({ "status": 500, "message": "Internal Server Error" });
    }
})

router.post('/validateUser', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const adminServiceObj = new AdminService()
            const message = await adminServiceObj.validateUser(req.body)
            res.send({
                "status": 200,
                "message": message,

            })
        } else {
            res.send({
                "status": 401,
                "message": "only Super Admin has access to validate users",
            })
        }
    } catch (err) {
        // Check if the error is an instance of HTTP Errors
        if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
            return res.status(err.statusCode).send({ "status": err.statusCode, "message": err.message });
        }
        // For other errors, use a generic server error response
        return res.status(500).send({ "status": 500, "message": "Internal Server Error" });
    }
})

router.get('/getOverview', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const adminServiceObj = new AdminService();
            const data = await adminServiceObj.getOverview();

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only Super Admin has access to getOverview",
            })
        }

    } catch (err) {
        // Check if the error is an instance of HTTP Errors
        if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
            return res.status(err.statusCode).send({ "status": err.statusCode, "message": err.message });
        }
        // For other errors, use a generic server error response
        return res.status(500).send({ "status": 500, "message": "Internal Server Error" });
    }
})

router.get('/getVolunteersData', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const adminServiceObj = new AdminService();
            const data = await adminServiceObj.getVolunteersData();

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only Super Admin has access to get Volunteers Data",
            })
        }

    } catch (err) {
        // Check if the error is an instance of HTTP Errors
        if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
            return res.status(err.statusCode).send({ "status": err.statusCode, "message": err.message });
        }
        // For other errors, use a generic server error response
        return res.status(500).send({ "status": 500, "message": "Internal Server Error" });
    }
})

router.get('/getVolunteersByBoothId', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {

            const boothId = req.query.booth_id;

            const adminServiceObj = new AdminService();
            const data = await adminServiceObj.getVolunteersByBoothId(boothId);

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only Super Admin has access to getVolunteersByBoothId",
            })
        }

    } catch (err) {
        // Check if the error is an instance of HTTP Errors
        if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
            return res.status(err.statusCode).send({ "status": err.statusCode, "message": err.message });
        }
        // For other errors, use a generic server error response
        return res.status(500).send({ "status": 500, "message": "Internal Server Error" });
    }
})

module.exports = router;