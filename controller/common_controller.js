const express = require('express')
const CommonService = require("../services/common_service")
const JwtHelper = require('../utils/Helpers/jwt_helper')
const jwtHelperObj = new JwtHelper();
const multer = require("multer");
const router = express.Router()
const Constants = require('../utils/Constants/response_messages')

router.get('/getAllParliments', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const adminServiceObj = new CommonService();
        const data = await adminServiceObj.getAllParliments();

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

router.get('/assembliesByParliament', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const parlimentName = req.query.parliment;

        if (!parlimentName) {
            return res.status(400).send('Parliament name is required');
        }

        const adminServiceObj = new CommonService();
        const data = await adminServiceObj.assembliesByParliament(parlimentName);

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

router.get('/getBooths', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {

        const parlimentName = req.query.parliment;
        const assemblyName = req.query.assembly;

        if (!parlimentName || !assemblyName) {
            return res.status(400).send('Both parliament and assembly names are required');
        }

        const adminServiceObj = new CommonService();
        const data = await adminServiceObj.getBooths(parlimentName, assemblyName);

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

router.get('/getBoothAddress', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {

        const parlimentName = req.query.parliment;
        const assemblyName = req.query.assembly;
        const boothName = req.query.booth;

        if (!parlimentName || !assemblyName || !boothName) {
            return res.status(400).send('parliament, assembly and booth names are required');
        }

        const adminServiceObj = new CommonService();
        const data = await adminServiceObj.getBoothAddress(parlimentName, assemblyName, boothName);

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

module.exports = router;