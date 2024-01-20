const Constants = require('../utils/Constants/response_messages')
const { Op } = require('sequelize')
const { uploadFile } = require('../AWS/aws')
const users = require("../utils/Models/Users/UsersModel")
const userstatus = require("../utils/Models/UserStatus/UserStatusModel")
const pabs = require("../utils/Models/PAB/PABModel")
const volunteers = require("../utils/Models/Volunteers/VolunteersModel")
const rejectedusers = require("../utils/Models/RejectedUsers/RejectedUsersModel")

class AdminService {
    constructor() {

    }

    async createSuperAdmin(userdetails, files) {
        try {
            // Check if a user with the same email or phone number already exists in users
            const checkInUsers = await users.findOne({
                where: {
                    [Op.or]: [
                        { emailId: userdetails.emailId },
                        { phn_no: userdetails.phn_no }
                    ]
                }
            });

            if (checkInUsers) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("EMAIL ID OR PHONE NUMBER ALREADY IN USE");
            }

            if (files.length === 0 || files[0].fieldname !== "profileImage") {
                throw new Error("Required profileImage as key and file as value");
            }

            if (!["image/png", "image/jpg", "image/jpeg"].includes(files[0].mimetype)) {
                throw new Error("Only .png, .jpg, and .jpeg formats allowed!");
            }

            let uploadedFileURL = await uploadFile(files[0], "AdminImg");
            const password = userdetails.password;
            const randomkey = await global.DATA.PLUGINS.bcrypt.genSalt(10);
            const hashedPassword = await global.DATA.PLUGINS.bcrypt.hash(password, randomkey);

            const userPayload = {
                emailId: userdetails.emailId,
                password: hashedPassword,
                user_name: userdetails.user_name,
                phn_no: userdetails.phn_no,
                address: userdetails.address,
                photo_url: uploadedFileURL,
                role_type: userdetails.role_type,
            };

            const newUser = await users.create(userPayload);
            return newUser;
        } catch (err) {
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            console.error("Error in createSuperAdmin: ", err.message);
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }


    async getUsersList() {
        try {
            const data = await userstatus.findAll()
                .catch(err => {
                    console.log("Error while reading the userstatus details", err);
                    throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
                })
            return data;
        }
        catch (err) {
            throw err;
        }
    }

    async getAllSurveyorList() {
        try {
            const usersData = await users.findAll({
                attributes: ['user_name'],
                where: {
                    id: {
                        [Op.ne]: 1 // 'ne' stands for 'not equal'
                    }
                }
            });

            // Extract user names into an array
            const surveyorNames = usersData.map(surveyor => surveyor.user_name);

            return surveyorNames;
        }catch (err) {
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            console.error("Error in getAllSurveyorList: ", err.message);
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async validateUser(userDetails) {
        try {

            if (userDetails.status === 'R') {

                await global.DATA.CONNECTION.mysql.transaction(async (t) => {

                    // Get the details from the userstatus table
                    const data = await userstatus.findOne({
                        where: {
                            emailId: userDetails.emailId
                        },
                        transaction: t
                    }).catch(err => {
                        console.log(err);
                        throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                    })

                    if (!data) {
                        throw new global.DATA.PLUGINS.httperrors.BadRequest("NO USER EXISTS WITH GIVEN EMAIL ID");
                    }

                    // Add to the rejectedusers table
                    await rejectedusers.create({
                        emailId: data.emailId,
                        password: data.password,
                        user_name: data.user_name,
                        phn_no: data.phn_no,
                        address: data.address,
                        photo_url: data.photo_url,
                        role_type: data.role_type,
                    }, {
                        transaction: t
                    }).catch(err => {
                        console.log(err);
                        throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                    })

                    //Delete from the userstatus table
                    await userstatus.destroy({
                        where: {
                            emailId: userDetails.emailId
                        },
                        transaction: t
                    }).catch(err => {
                        throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                    })

                })
                return "REJECTED"
            }

            if (userDetails.status === 'V') {
                // Delete from the user status and add to the user table
                await global.DATA.CONNECTION.mysql.transaction(async (t) => {

                    // Get the details from the userstatus table
                    const data = await userstatus.findOne({
                        where: {
                            emailId: userDetails.emailId
                        },
                        transaction: t
                    }).catch(err => {
                        console.log(err);
                        throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                    })

                    if (!data) {
                        throw new global.DATA.PLUGINS.httperrors.BadRequest("NO USER EXISTS WITH GIVEN EMAIL ID");
                    }

                    // Add to the users table
                    await users.create({
                        emailId: data.emailId,
                        password: data.password,
                        user_name: data.user_name,
                        role_type: data.role_type,
                        phn_no: data.phn_no,
                        address: data.address,
                        photo_url: data.photo_url
                    }, {
                        transaction: t
                    }).catch(err => {
                        console.log(err);
                        throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                    })

                    //Delete from the userstatus table
                    await userstatus.destroy({
                        where: {
                            emailId: userDetails.emailId
                        },
                        transaction: t
                    }).catch(err => {
                        throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                    })

                })
                return "APPROVED"
            }

        } catch (err) {
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            console.error("Error in validateUser: ", err.message);
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async getOverview() {
        try {
            const Red = await pabs.count({
                where: { no_volunteers: 0 }
            }).catch(err => {
                console.log("Error while reading the noVolunteersZero", err.message);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
            })

            const Yellow = await pabs.count({
                where: {
                    no_volunteers: {
                        [Op.gte]: 1,  // Greater than or equal to 1
                        [Op.lte]: 7   // Less than or equal to 7
                    }
                }
            }).catch(err => {
                console.log("Error while reading the noVolunteersOneToSeven", err.message);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
            })

            const Green = await pabs.count({
                where: {
                    no_volunteers: { [Op.gt]: 7 } // Greater than 7
                }
            }).catch(err => {
                console.log("Error while reading the noVolunteersMoreThanSeven", err.message);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
            })

            const data = {
                Red,
                Green,
                Yellow
            }

            return data;
        } catch (err) {
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            console.error("Error while fetching Overview data: ", err.message);
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async getVolunteersData() {
        try {
            const volunteersData = await volunteers.findAll({
                include: [{
                    model: users,
                    attributes: ['user_name', 'emailId', 'phn_no']
                }],
                order: [['updatedAt', 'DESC']]  // Order by 'updatedAt' in descending order
            });

            // Process the results to format as per requirements
            const formattedVolunteers = volunteersData.map(volunteer => {
                const volunteerData = volunteer.get({ plain: true });

                // Extract user data and rename keys
                const userData = volunteerData.user ? {
                    surveyor_name: volunteerData.user.user_name,
                    surveyor_emailId: volunteerData.user.emailId,
                    surveyor_phn_no: volunteerData.user.phn_no
                } : {};

                // Remove the user object and add the renamed keys to the main object
                delete volunteerData.user;
                return { ...volunteerData, ...userData };
            });

            return formattedVolunteers;
        } catch (err) {
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            console.error("Error while fetching volunteers data: ", err.message);
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }
}

module.exports = AdminService;