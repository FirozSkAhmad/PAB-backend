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

router.get('/getAllAssemblies', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const adminServiceObj = new CommonService();
        const data = await adminServiceObj.getAllAssemblies();

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

router.get('/talukasByAssembly', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const assemblyName = req.query.assembly;

        if (!assemblyName) {
            return res.status(400).send('Assembly name is required');
        }

        const adminServiceObj = new CommonService();
        const data = await adminServiceObj.talukasByAssembly(assemblyName);

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

        const assemblyName = req.query.assembly;
        const talukaName = req.query.taluka;

        if (!assemblyName || !talukaName) {
            return res.status(400).send('Both assembly and taluka names are required');
        }

        const adminServiceObj = new CommonService();
        const data = await adminServiceObj.getBooths(assemblyName, talukaName);

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

        const assemblyName = req.query.assembly;
        const talukaName = req.query.taluka;
        const boothName = req.query.booth;

        if (!assemblyName || !talukaName || !boothName) {
            return res.status(400).send('assembly, taluka and booth names are required');
        }

        const adminServiceObj = new CommonService();
        const data = await adminServiceObj.getBoothAddress(assemblyName, talukaName, boothName);

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