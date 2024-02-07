const express = require('express')
const UserService = require('../services/users_service')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const jwtHelperObj = new JwtHelper();
const multer = require("multer");
const router = express.Router()
const Constants = require('../utils/Constants/response_messages')

router.post('/login', async (req, res, next) => {
    try {
        const userSeviceObj = new UserService();
        const data = await userSeviceObj.loginUser(req.body);
        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            "data": data
        })
    } catch (err) {
        // Check if the error is an instance of HTTP Errors
        if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
            return res.status(err.statusCode).send({ "status": err.statusCode, "message": err.message });
        }
        // For other errors, use a generic server error response
        return res.status(500).send({ "status": 500, "message": "Internal Server Error" });
    }
})

router.post('/register', multer().any(), async (req, res, next) => {
    try {
        const userSeviceObj = new UserService();
        const data = await userSeviceObj.createUser(req.body, req.files);
        res.send({
            "status": 201,
            "message": Constants.SUCCESS,
            "data": data
        })
    } catch (err) {
        // Check if the error is an instance of HTTP Errors
        if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
            return res.status(err.statusCode).send({ "status": err.statusCode, "message": err.message });
        }
        // For other errors, use a generic server error response
        return res.status(500).send({ "status": 500, "message": "Internal Server Error" });
    }
})

router.get('/getATS', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SURVEYOR" || req.aud.split(":")[1] === "SUPER ADMIN") {

            const adminServiceObj = new UserService();
            const data = await adminServiceObj.getATS();

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SURVEYOR or SUPER ADMIN has access to getATS",
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

router.get('/getBoothsByAT', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {

        if (req.aud.split(":")[1] === "SURVEYOR" || req.aud.split(":")[1] === "SUPER ADMIN") {

            const assemblyName = req.query.assembly;
            const talukaName = req.query.taluka;

            // Check if both assembly and taluka are provided
            if (!assemblyName || !talukaName) {
                return res.status(400).send('Assembly and Taluka are required');
            }

            const adminServiceObj = new UserService();
            const data = await adminServiceObj.getBoothsByAT(assemblyName, talukaName);

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SURVEYOR has access to getBoothsByAT",
            })
        }
    } catch (err) {
        // Check if the error is an instance of HTTP Errors
        if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
            return res.status(err.statusCode).send({ "status": err.statusCode, "message": err.message });
        }
        console.log(err.message)
        // For other errors, use a generic server error response
        return res.status(500).send({ "status": 500, "message": "Internal Server Error" });
    }
})

router.get('/getBoothDetailsByATB', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {

        if (req.aud.split(":")[1] === "SURVEYOR" || req.aud.split(":")[1] === "SUPER ADMIN") {

            const { assembly, taluka, booth } = req.query;

            // Check if assembly, taluka, and booth are provided
            if (!assembly || !taluka || !booth) {
                return res.status(400).send('Assembly, Taluka, and Booth are required');
            }
            const adminServiceObj = new UserService();
            const data = await adminServiceObj.getBoothDetailsByATB(assembly, taluka, booth);

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SURVEYOR has access to getBoothDetailsByATB",
            })
        }
    } catch (err) {
        // Check if the error is an instance of HTTP Errors
        if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
            return res.status(err.statusCode).send({ "status": err.statusCode, "message": err.message });
        }
        console.log(err.message)
        // For other errors, use a generic server error response
        return res.status(500).send({ "status": 500, "message": "Internal Server Error" });
    }
})

router.post('/volunteerOnboard', jwtHelperObj.verifyAccessToken, multer().any(), async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SURVEYOR" || req.aud.split(":")[1] === "SUPER ADMIN") {
            const userSeviceObj = new UserService();
            const data = await userSeviceObj.volunteerOnboard(req.body, req.files);
            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SURVEYOR has access to Onboard volunteer",
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

router.get('/getVolunteersDataBySurveyorId', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SURVEYOR") {

            const surveyorId = req.query.surveyor_id;

            const adminServiceObj = new UserService();
            const data = await adminServiceObj.getVolunteersData(surveyorId);

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SURVEYOR has access to getVolunteersDataBySurveyorId",
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

router.put('/volunteerUpdate/:volunteer_id', jwtHelperObj.verifyAccessToken, multer().any(), async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SURVEYOR" || req.aud.split(":")[1] === "SUPER ADMIN") {
            const volunteerId = req.params.volunteer_id;
            const userSeviceObj = new UserService();
            const data = await userSeviceObj.volunteerUpdate(volunteerId, req.body, req.files);
            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SURVEYOR or SUPER ADMIN has access to Edit volunteer",
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

router.delete('/deleteVolunteer/:volunteer_id', jwtHelperObj.verifyAccessToken, multer().any(), async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SURVEYOR" || req.aud.split(":")[1] === "SUPER ADMIN") {
            const volunteerId = req.params.volunteer_id;
            const userSeviceObj = new UserService();
            const data = await userSeviceObj.deleteVolunteer(volunteerId);
            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SURVEYOR or SUPER ADMIN has access to delete volunteer",
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