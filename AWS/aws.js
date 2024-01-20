const aws = require("aws-sdk");

aws.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRETACCESSKEY,
  region: "ap-south-1",
});

let uploadFile = async (file, folderName) => {
  return new Promise(function (resolve, reject) {
    // this function will upload file to aws and return the link

    let s3 = new aws.S3({ apiVersion: "2006-03-01" }); // we will be using the s3 service of aws

    var uploadParams = {
      ACL: "public-read",
      Bucket: "pab-volunteer-imgs", //HERE
      Key: `${folderName}/` + file.originalname, //HERE
      Body: file.buffer,
    };

    s3.upload(uploadParams, function (err, data) {
      if (err) {
        return reject({ error: err.message });
      }
      // console.log(data);
      console.log("file uploaded succesfully");
      return resolve(data.Location);
    });
  });
};

let deleteFile = async (fileName, folderName) => {
  return new Promise((resolve, reject) => {
    let s3 = new aws.S3({ apiVersion: "2006-03-01" });

    var deleteParams = {
      Bucket: "pab-volunteer-imgs",
      Key: `${folderName}/` + fileName
    };

    s3.deleteObject(deleteParams, function (err, data) {
      if (err) {
        return reject({ error: err.message });
      }
      console.log("File deleted successfully");
      return resolve(data);
    });
  });
};

module.exports = { uploadFile, deleteFile };