const express = require('express');
const AdminService = require('../services/admin_service');
const Constants = require('../utils/Constants/response_messages')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const multer = require("multer");
const jwtHelperObj = new JwtHelper();
const router = express.Router()

router.post('/createSuperAdmin', multer().any(), async (req, res, next) => {
    try {
        const adminServiceObj = new AdminService()
        await adminServiceObj.createSuperAdmin(req.body, req.files)
        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
        })
    }
    catch (err) {
        next(err);
    }
})

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
    }
    catch (err) {
        next(err);
    }
})

router.post('/validateUser', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const adminServiceObj = new AdminService()
            await adminServiceObj.validateUser(req.body)
            res.send({
                "status": 200,
                "message": Constants.SUCCESS,

            })
        } else {
            res.send({
                "status": 401,
                "message": "only Super Admin has access to validate users",
            })
        }
    }
    catch (err) {
        next(err);
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

    }
    catch (err) {
        next(err);
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

    }
    catch (err) {
        next(err);
    }
})

module.exports = router;