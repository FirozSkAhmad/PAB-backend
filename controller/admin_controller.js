const express = require('express');
const AdminService = require('../services/admin_service');
const Constants = require('../utils/Constants/response_messages')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const multer = require("multer");
const jwtHelperObj = new JwtHelper();
const router = express.Router()

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

router.get('/getAllSurveyorList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const adminServiceObj = new AdminService();
            const data = await adminServiceObj.getAllSurveyorList();

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