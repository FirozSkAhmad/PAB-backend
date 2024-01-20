const express = require('express')
const router = express.Router()
const Constants = require('../utils/Constants/response_messages')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const BulkUploadService = require('../services/bulkupload_service')
const jwtHelperObj = new JwtHelper();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Function to verify if the uploaded file is a CSV
function isCsvFile(file) {
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    const mimeType = file.mimetype;
    return fileExtension === 'csv' && mimeType === 'text/csv';
}

router.post("/bulkUpload", jwtHelperObj.verifyAccessToken, upload.single('file'), async (req, res, next) => { //jwtHelperObj.verifyAccessToken,
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            try {
                if (!req.file || !isCsvFile(req.file)) {
                    return res.status(400).send({ "status": 400, "message": "Invalid file format. Please upload a CSV file." });
                }

                const bulkUploadServiceObj = new BulkUploadService();
                const result = await bulkUploadServiceObj.processCsvFile(req.file.buffer);
                res.send(result)
            }
            catch (error) {
                // Send the error message in the response
                res.status(500).send({
                    "status": 500,
                    error: error
                });
            }
        }
        else {
            res.send({
                "status": 401,
                "message": "only Super Admin has access to upload the data",
            })
        }

    }
    catch (err) {
        console.log("error while uploading the data", err);
        next(err);
    }
})

module.exports = router;