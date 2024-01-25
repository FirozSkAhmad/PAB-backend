const Constants = require('../utils/Constants/response_messages')
const { Op } = require('sequelize')
const { uploadFile } = require('../AWS/aws')
const users = require("../utils/Models/Users/UsersModel")
const userstatus = require("../utils/Models/UserStatus/UserStatusModel")
const pabs = require("../utils/Models/PAB/PABModel")
const volunteers = require("../utils/Models/Volunteers/VolunteersModel")
const rejectedusers = require("../utils/Models/RejectedUsers/RejectedUsersModel")
const nodemailer = require('nodemailer');

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
            const users = await userstatus.findAll({
                order: [['updatedAt', 'DESC']] // Correctly placed inside the findAll options
            }).catch(err => {
                console.log("Error while reading the userstatus details", err);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
            });

            // Map over the array to exclude the password property and rename user_name to surveyor_name
            const usersData = users.map(user => {
                const { password, user_name, ...userWithoutPassword } = user.get({ plain: true });

                return {
                    ...userWithoutPassword,
                    surveyor_name: user_name // Rename user_name to surveyor_name
                };
            });

            return usersData;

        } catch (err) {
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
        } catch (err) {
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
                        console.log(err.message);
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
                        console.log(err.message);
                        throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                    })

                    //Delete from the userstatus table
                    await userstatus.destroy({
                        where: {
                            emailId: userDetails.emailId
                        },
                        transaction: t
                    }).catch(err => {
                        console.log("Error in deteling surveyor in userstatus table: ", err.message)
                        throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                    })

                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.SENDER_EMAIL_ID,
                            pass: process.env.SENDER_PASSWORD
                        }
                    });

                    const mailOptions = {
                        from: process.env.SENDER_EMAIL_ID,
                        to: userDetails.emailId,
                        subject: "Notification of Approval or Rejection",
                        text: 'SURVEYOR REJECTED',
                    };

                    transporter.sendMail(mailOptions, function (err, info) {
                        if (err) {
                            console.error('Error sending email', err);
                        } else {
                            console.log(`Email sent: ${info.response}`);
                        }
                    });
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
                        console.log(err.message);
                        throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                    })

                    if (!data) {
                        throw new global.DATA.PLUGINS.httperrors.BadRequest("NO USER EXISTS WITH GIVEN EMAIL ID");
                    }

                    const password = data.password;
                    const randomkey = await global.DATA.PLUGINS.bcrypt.genSalt(10);
                    const hashedPassword = await global.DATA.PLUGINS.bcrypt.hash(password, randomkey);

                    // Add to the users table
                    await users.create({
                        emailId: data.emailId,
                        password: hashedPassword,
                        user_name: data.user_name,
                        role_type: data.role_type,
                        phn_no: data.phn_no,
                        address: data.address,
                        photo_url: data.photo_url
                    }, {
                        transaction: t
                    }).catch(err => {
                        console.log(err.message);
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

                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.SENDER_EMAIL_ID,
                            pass: process.env.SENDER_PASSWORD
                        }
                    });

                    const mailOptions = {
                        from: process.env.SENDER_EMAIL_ID,
                        to: userDetails.emailId,
                        subject: "Notification of Approval or Rejection",
                        text: `SURVEYOR APPROVED, CREDENTIALS:- phn_no:${data.phn_no}, password:${data.password} `,
                    };

                    transporter.sendMail(mailOptions, function (err, info) {
                        if (err) {
                            console.error('Error sending email', err);
                        } else {
                            console.log(`Email sent: ${info.response}`);
                        }
                    });
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

            // Helper function to determine booth status
            async function getBoothStatus(assembly, taluka, booth) {
                const pabData = await pabs.findOne({
                    where: { assembly, taluka, booth },
                    attributes: ['no_volunteers']
                });
                console.log(pabData)
                if (pabData) {
                    const noVolunteers = pabData.no_volunteers;
                    if (noVolunteers === 0) return 'RED';
                    if (noVolunteers >= 1 && noVolunteers <= 7) return 'YELLOW';
                    return 'GREEN';
                }

                return 'UNKNOWN'; // Default status if no data is found
            }

            const volunteersData = await volunteers.findAll({
                include: [{
                    model: users,
                    attributes: ['user_name', 'emailId', 'phn_no']
                }],
                order: [['updatedAt', 'DESC']]  // Order by 'updatedAt' in descending order
            });

            // Process the results to format as per requirements
            const formattedVolunteers = await Promise.all(volunteersData.map(async volunteer => {
                const volunteerData = volunteer.get({ plain: true });

                // Extract user data and rename keys
                const userData = volunteerData.user ? {
                    surveyor_name: volunteerData.user.user_name,
                    surveyor_emailId: volunteerData.user.emailId,
                    surveyor_phn_no: volunteerData.user.phn_no
                } : {};

                // Get booth status
                const boothStatus = await getBoothStatus(volunteerData.assembly, volunteerData.taluka, volunteerData.booth);

                // Remove the user object and add the renamed keys and booth status to the main object
                delete volunteerData.user;
                return { ...volunteerData, ...userData, booth_status: boothStatus };
            }));

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

    async getVolunteersByBoothId(boothId) {
        try {

            // // Helper function to get volunteer details
            async function getVolunteerDetails(boothId, designation, assembly, taluka, booth, noVolunteers) {
                const volunteerData = await volunteers.findOne({
                    where: {
                        booth_id: boothId,
                        designation: designation
                    },
                    include: [{
                        model: users, // Ensure 'users' is correctly associated with 'volunteers'
                        attributes: ['user_name'] // Fetch only 'user_name' from 'users'
                    }],
                    attributes: ['volunteer_name', 'phn_no', 'photo_url'] // Specific fields from 'volunteers'
                });

                if (!volunteerData) {
                    return 'NOT FILLED';
                }

                // Process the results to format as per requirements
                const volunteer = volunteerData.get({ plain: true });

                // Extract user data and rename keys
                const userData = volunteer.user ? {
                    surveyor_name: volunteer.user.user_name
                } : {};

                // Remove the user object and add the renamed keys and pabRow data to the main object
                delete volunteer.user;

                const output = {
                    ...volunteer,
                    ...userData,
                    assembly,
                    taluka,
                    booth
                };

                if (noVolunteers === 0) {
                    output.booth_status = 'RED';
                } else if (noVolunteers >= 1 && noVolunteers <= 7) {
                    output.booth_status = 'YELLOW';
                } else {
                    output.booth_status = 'GREEN';
                }

                return output;
            }

            // Helper function to fetch volunteers
            async function fetchVolunteers(boothId, assembly, taluka, booth, noVolunteers) {
                const volunteerList = await volunteers.findAll({
                    where: {
                        booth_id: boothId,
                        designation: 'VOLUNTEER'
                    },
                    include: [{
                        model: users,
                        attributes: ['user_name']
                    }],
                    attributes: ['volunteer_name', 'phn_no', 'photo_url']
                });

                return volunteerList.map(volunteerData => {
                    const volunteer = volunteerData.get({ plain: true });
                    const userData = volunteer.user ? {
                        surveyor_name: volunteer.user.user_name
                    } : {};

                    delete volunteer.user;

                    const output = {
                        ...volunteer,
                        ...userData,
                        assembly,
                        taluka,
                        booth
                    };

                    if (noVolunteers === 0) {
                        output.booth_status = 'RED';
                    } else if (noVolunteers >= 1 && noVolunteers <= 7) {
                        output.booth_status = 'YELLOW';
                    } else {
                        output.booth_status = 'GREEN';
                    }

                    return output;

                });
            }

            const pabRow = await pabs.findByPk(boothId);

            if (!pabRow) {
                return res.status(404).send('Booth not found');
            }

            // Calculating volunteers_count
            let volunteers_count = pabRow.total_volunteers;
            if (pabRow.president !== 'NOT FILLED') volunteers_count--;
            if (pabRow.agent_1 !== 'NOT FILLED') volunteers_count--;
            if (pabRow.agent_2 !== 'NOT FILLED') volunteers_count--;

            const output = {
                PRESIDENT: await getVolunteerDetails(boothId, 'PRESIDENT', pabRow.assembly, pabRow.taluka, pabRow.booth, pabRow.no_volunteers),
                BLA1: await getVolunteerDetails(boothId, 'BLA1', pabRow.assembly, pabRow.taluka, pabRow.booth, pabRow.no_volunteers),
                BLA2: await getVolunteerDetails(boothId, 'BLA2', pabRow.assembly, pabRow.taluka, pabRow.booth, pabRow.no_volunteers)
            };

            // Add volunteers if volunteers_count is more than 0
            if (pabRow.no_volunteers > 0) {
                output.volunteers = await fetchVolunteers(boothId, pabRow.assembly, pabRow.taluka, pabRow.booth, pabRow.no_volunteers);
            }

            return output;

        } catch (err) {
            // Check if the error is an instance of HTTP Errors
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                // Rethrow the original HTTP error
                throw err;
            }

            // Log and throw an internal server error for other types of errors
            console.error("Error during getVolunteersByBoothId process: ", err.message);
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred: ", err.message);
        }
    }
}

module.exports = AdminService;