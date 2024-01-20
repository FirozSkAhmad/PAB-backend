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
    }
    catch (err) {
        next(err);
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
    }
    catch (err) {
        next(err);
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
    }
    catch (err) {
        next(err);
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

    }
    catch (err) {
        next(err);
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
    }
    catch (err) {
        next(err);
    }
})

router.delete('/deleteVolunteer/:id', multer().any(), async (req, res, next) => {
    try {
        const volunteerId = req.params.id;
        const userSeviceObj = new UserService();
        const data = await userSeviceObj.deleteVolunteer(volunteerId);
        res.send({
            "status": 201,
            "message": Constants.SUCCESS,
            "data": data
        })
    }
    catch (err) {
        next(err);
    }
})

module.exports = router;