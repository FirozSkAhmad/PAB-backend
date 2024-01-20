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

router.post('/volunteerOnboard', jwtHelperObj.verifyAccessToken, multer().any(), async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SURVEYOR") {
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

router.put('/volunteerUpdate/:id', jwtHelperObj.verifyAccessToken, multer().any(), async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SURVEYOR") {
            const volunteerId = req.params.id;
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
                "message": "only SURVEYOR has access to Edit volunteer",
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

router.delete('/deleteVolunteer/:id', jwtHelperObj.verifyAccessToken, multer().any(), async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SURVEYOR") {
            const volunteerId = req.params.id;
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
                "message": "only SURVEYOR has access to Edit volunteer",
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