const Constants = require('../utils/Constants/response_messages')
const JWTHelper = require('../utils/Helpers/jwt_helper')
const { uploadFile, deleteFile } = require("../AWS/aws");
const { Op } = require('sequelize')
const users = require("../utils/Models/Users/UsersModel")
const userstatus = require("../utils/Models/UserStatus/UserStatusModel")
const pabs = require("../utils/Models/PAB/PABModel")
const volunteers = require("../utils/Models/Volunteers/VolunteersModel")


class UserService {
    constructor() {
        this.jwtObject = new JWTHelper();
    }

    async loginUser(userDetails) {
        try {

            let user = await users.findOne({
                "where": {
                    phn_no: userDetails.phn_no
                }
            }).catch(err => {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
            })

            if (!user) {
                throw new global.DATA.PLUGINS.httperrors.NotFound("No user exists with given phone no")
            }

            const userPassword = user.password;

            const isValid = await global.DATA.PLUGINS.bcrypt.compare(userDetails.password, userPassword);
            if (!isValid) {
                throw new global.DATA.PLUGINS.httperrors.Unauthorized("Incorrect Password")
            }

            // Valid email and password
            const tokenPayload = `${user.id}:${user.role_type}`

            const accessToken = await this.jwtObject.generateAccessToken(tokenPayload);

            const data = {
                accessToken, "id": user.id, "email": user.emailId, "role_type": user.role_type, "user_name": user.user_name, "phn_no": user.phn_no
            }
            return data
        }
        catch (err) {
            // Check if the error is an instance of HTTP Errors
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                // Rethrow the original HTTP error
                throw err;
            }

            // Log and throw an internal server error for other types of errors
            console.error("Error in createUser: ", err.message);
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async createUser(userdetails, files) {
        try {
            // Check if a user with the same email or phone number already exists in userstatus
            const checkInUserStatus = await userstatus.findOne({
                where: {
                    [Op.or]: [
                        { emailId: userdetails.emailId },
                        { phn_no: userdetails.phn_no }
                    ]
                }
            });

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

            if (checkInUserStatus) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("ALREADY REGISTERED WITH THE SAME EMAIL ID OR PHONE NUMBER");
            }


            if (files.length === 0 || files[0].fieldname !== "profileImage") {
                throw new Error("required profileImage as key and file as value");
            }

            if (!["image/png", "image/jpg", "image/jpeg"].includes(files[0].mimetype)) {
                throw new Error("Only .png, .jpg and .jpeg format allowed!");
            }

            let uploadedFileURL = await uploadFile(files[0], "VolunteerImgs");

            // User Id not present
            const password = userdetails.password;
            const confirmpassword = userdetails.confirmpassword;

            if (password !== confirmpassword) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("PASSWORDS DOES NOT MATCH")
            }

            const randomkey = await global.DATA.PLUGINS.bcrypt.genSalt(10);
            const hashedPassword = await global.DATA.PLUGINS.bcrypt.hash(password, randomkey)

            const userPayload = {
                emailId: userdetails.emailId,
                role_type: userdetails.role_type,
                password: hashedPassword,
                user_name: userdetails.user_name,
                phn_no: userdetails.phn_no,
                address: userdetails.address,
                photo_url: uploadedFileURL,
                status: "NV",
                role_type: userdetails.role_type
            }

            const newUser = await userstatus.create(userPayload).catch(err => {
                console.log("Error while adding in userstatus table", err.message);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
            });

            return newUser;
        } catch (err) {
            // Check if the error is an instance of HTTP Errors
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                // Rethrow the original HTTP error
                throw err;
            }

            // Log and throw an internal server error for other types of errors
            console.error("Error in createUser: ", err.message);
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async volunteerOnboard(userdetails, files) {
        return await global.DATA.CONNECTION.mysql.transaction(async (t) => {
            try {
                const surveyor = await users.findOne({
                    where: {
                        id: userdetails.surveyor_id,
                        role_type: "SURVEYOR"
                    }
                });

                if (!surveyor) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("NO SURVEYOR EXISTS WITH GIVEN SURVEYOR ID");
                }

                const pab = await pabs.findOne({
                    where: {
                        assembly: userdetails.assembly,
                        taluka: userdetails.taluka,
                        booth: userdetails.booth,
                        address: userdetails.booth_address
                    },
                    transaction: t
                });

                if (!pab) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("NO BOOTH EXISTS WITH THE GIVEN ASSEMBLY, TALUKA, BOOTH COMBINATION AND BOOTH ADDRESS");
                }

                if (!["PRESIDENT", "AGENT_1", "AGENT_2", "VOLUNTEER"].includes(userdetails.designation)) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("Invalid designation. Must be one of PRESIDENT, AGENT_1, AGENT_2, or VOLUNTEER.");
                }

                const volunteer = await volunteers.findOne({
                    where: {
                        [Op.or]: [
                            { emailId: userdetails.emailId },
                            { phn_no: userdetails.phn_no }
                        ]
                    }
                });

                if (volunteer) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("VOLUNTEER ALREADY EXISTS WITH GIVEN EMAIL ID OR PHONE NUMBER");
                }

                if (files.length === 0 || files[0].fieldname !== "profileImage") {
                    throw new Error("required profileImage as key and file as value");
                }

                if (!["image/png", "image/jpg", "image/jpeg"].includes(files[0].mimetype)) {
                    throw new Error("Only .png, .jpg and .jpeg format allowed!");
                }

                let uploadedFileURL = await uploadFile(files[0], "VolunteerImgs");

                const designationChecks = {
                    "PRESIDENT": "president",
                    "AGENT_1": "agent_1",
                    "AGENT_2": "agent_2"
                };

                const designation = userdetails.designation;
                if (designation in designationChecks) {
                    const key = designationChecks[designation];
                    if (pab[key] === "FILLED") {
                        throw new global.DATA.PLUGINS.httperrors.BadRequest(`THERE IS ALREADY A ${designation} IN THIS BOOTH`);
                    } else {
                        await pabs.update(
                            { no_volunteers: pab.no_volunteers + 1, [key]: "FILLED" },
                            { where: { id: pab.id }, transaction: t }
                        );
                    }
                } else {
                    await pabs.update(
                        { no_volunteers: pab.no_volunteers + 1 },
                        { where: { id: pab.id }, transaction: t }
                    );
                }

                const Payload = {
                    surveyor_id: userdetails.surveyor_id,
                    assembly: userdetails.assembly,
                    taluka: userdetails.taluka,
                    booth: userdetails.booth,
                    booth_address: userdetails.booth_address,
                    booth_id: pab.id,
                    volunteer_name: userdetails.volunteer_name,
                    phn_no: userdetails.phn_no,
                    emailId: userdetails.emailId,
                    gender: userdetails.gender,
                    age: userdetails.age,
                    caste: userdetails.caste,
                    occupation: userdetails.occupation,
                    house_no: userdetails.house_no,
                    designation: userdetails.designation,
                    volunteer_address: userdetails.volunteer_address,
                    file_name: files[0].originalname,
                    photo_url: uploadedFileURL,
                };

                const newVolunteer = await volunteers.create(Payload, { transaction: t });
                return newVolunteer;

            } catch (err) {
                // Check if the error is an instance of HTTP Errors
                if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                    // Rethrow the original HTTP error
                    throw err;
                }

                // Log and throw an internal server error for other types of errors
                console.error("Error during volunteer onboard process: ", err.message);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred: ", err.message);
            }
        });
    }

    async getVolunteersData(surveyorId) {
        try {

            const surveyor = await users.findOne({
                where: {
                    id: surveyorId,
                    role_type: "SURVEYOR"
                }
            });

            if (!surveyor) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("NO SURVEYOR EXISTS WITH GIVEN SURVEYOR ID");
            }

            const volunteersData = await volunteers.findAll({
                where: {
                    surveyor_id: surveyorId
                },
                order: [['updatedAt', 'DESC']] // Sorting by updatedAt in descending order
            });

            return volunteersData

        } catch (err) {
            // Check if the error is an instance of HTTP Errors
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                // Rethrow the original HTTP error
                throw err;
            }

            // Log and throw an internal server error for other types of errors
            console.error("Error during getVolunteersData process: ", err.message);
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred: ", err.message);
        }
    }

    async volunteerUpdate(volunteerId, userdetails, files) {

        return await global.DATA.CONNECTION.mysql.transaction(async (t) => {
            try {

                if (!["PRESIDENT", "AGENT_1", "AGENT_2", "VOLUNTEER"].includes(userdetails.designation)) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("Invalid designation. Must be one of PRESIDENT, AGENT_1, AGENT_2, or VOLUNTEER.");
                }

                const volunteer = await volunteers.findOne({
                    where: {
                        id: volunteerId,
                    },
                    transaction: t
                });

                if (!volunteer) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("NO VOLUNTEER EXISTS WITH GIVEN id");
                }

                const volunteerData = await volunteers.findOne({
                    where: {
                        [Op.and]: [
                            {
                                [Op.or]: [
                                    { emailId: userdetails.emailId },
                                    { phn_no: userdetails.phn_no }
                                ]
                            },
                            {
                                id: { [Op.not]: volunteerId }
                            }
                        ]
                    }
                });

                if (volunteerData) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("VOLUNTEER ALREADY EXISTS WITH GIVEN EMAIL ID OR PHONE NUMBER");
                }

                let updatedBoothId
                if (volunteer.assembly !== userdetails.assembly || volunteer.taluka !== userdetails.taluka || volunteer.booth !== userdetails.booth || volunteer.booth_address !== userdetails.booth_address) {
                    const pab = await pabs.findOne({
                        where: {
                            assembly: volunteer.assembly,
                            taluka: volunteer.taluka,
                            booth: volunteer.booth,
                        },
                        transaction: t
                    });

                    const designationChecks = {
                        "PRESIDENT": "president",
                        "AGENT_1": "agent_1",
                        "AGENT_2": "agent_2"
                    };

                    if (volunteer.designation in designationChecks) {
                        const key = designationChecks[volunteer.designation];
                        if (pab[key] === "FILLED") {
                            await pabs.update(
                                { no_volunteers: pab.no_volunteers - 1, [key]: "NOT FILLED" },
                                { where: { id: pab.id }, transaction: t }
                            );
                        }
                    } else {
                        await pabs.update(
                            { no_volunteers: pab.no_volunteers - 1 },
                            { where: { id: pab.id }, transaction: t }
                        );
                    }

                    const newPab = await pabs.findOne({
                        where: {
                            assembly: userdetails.assembly,
                            taluka: userdetails.taluka,
                            booth: userdetails.booth,
                            address: userdetails.booth_address
                        },
                        transaction: t
                    });

                    if (!newPab) {
                        throw new global.DATA.PLUGINS.httperrors.BadRequest("NO BOOTH EXISTS WITH THE GIVEN ASSEMBLY, TALUKA, BOOTH COMBINATION AND BOOTH ADDRESS");
                    }

                    const designation = userdetails.designation;
                    if (designation in designationChecks) {
                        const key = designationChecks[designation];
                        if (newPab[key] === "FILLED") {
                            throw new global.DATA.PLUGINS.httperrors.BadRequest(`THERE IS ALREADY A ${designation} IN THIS BOOTH`);
                        } else {
                            await pabs.update(
                                { no_volunteers: newPab.no_volunteers + 1, [key]: "FILLED" },
                                { where: { id: newPab.id }, transaction: t }
                            );
                        }
                    } else {
                        await pabs.update(
                            { no_volunteers: newPab.no_volunteers + 1 },
                            { where: { id: newPab.id }, transaction: t }
                        );
                    }

                    updatedBoothId = newPab.id
                }
                else {
                    updatedBoothId = volunteer.booth_id

                    const pab = await pabs.findOne({
                        where: {
                            id: volunteer.booth_id
                        },
                        transaction: t
                    });

                    const designationChecks = {
                        "PRESIDENT": "president",
                        "AGENT_1": "agent_1",
                        "AGENT_2": "agent_2"
                    };

                    const designation = userdetails.designation;

                    if (designation !== volunteer.designation) {
                        if (designation in designationChecks) {
                            const key = designationChecks[designation];
                            if (pab[key] === "FILLED") {
                                throw new global.DATA.PLUGINS.httperrors.BadRequest(`THERE IS ALREADY A ${designation} IN THIS BOOTH`);
                            } else {
                                await pabs.update(
                                    { [designationChecks[volunteer.designation]]: "NOT FILLED", [key]: "FILLED" },
                                    { where: { id: pab.id }, transaction: t }
                                );
                            }
                        }
                    }

                }

                if (files.length === 0 || files[0].fieldname !== "profileImage") {
                    throw new Error("required profileImage as key and file as value");
                }

                if (!["image/png", "image/jpg", "image/jpeg"].includes(files[0].mimetype)) {
                    throw new Error("Only .png, .jpg and .jpeg format allowed!");
                }

                let updatedUploadedFileURL
                let updatedFileName
                if (files[0].originalname !== volunteer.file_name) {
                    // Delete the previous file from S3
                    await deleteFile(volunteer.file_name, "VolunteerImgs");

                    // Upload the new file to S3
                    updatedUploadedFileURL = await uploadFile(files[0], "VolunteerImgs");

                    updatedFileName = files[0].originalname
                }
                else {
                    updatedUploadedFileURL = volunteer.photo_url
                    updatedFileName = volunteer.file_name
                }

                const updatedObj = {
                    assembly: userdetails.assembly,
                    taluka: userdetails.taluka,
                    booth: userdetails.booth,
                    booth_address: userdetails.booth_address,
                    booth_id: updatedBoothId,
                    volunteer_name: userdetails.volunteer_name,
                    phn_no: userdetails.phn_no,
                    emailId: userdetails.emailId,
                    gender: userdetails.gender,
                    age: userdetails.age,
                    caste: userdetails.caste,
                    occupation: userdetails.occupation,
                    house_no: userdetails.house_no,
                    designation: userdetails.designation,
                    volunteer_address: userdetails.volunteer_address,
                    file_name: updatedFileName,
                    photo_url: updatedUploadedFileURL,
                };

                const updatedVolunteer = await volunteers.update(updatedObj, {
                    where: { id: volunteerId }
                });

                if (updatedVolunteer[0] === 0) { // Check if the update was successful
                    throw new Error("Volunteer not found or no changes made.");
                }

                return 'Volunteer updated successfully'

            } catch (err) {
                // Check if the error is an instance of HTTP Errors
                if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                    // Rethrow the original HTTP error
                    throw err;
                }

                // Log and throw an internal server error for other types of errors
                console.error("Error during olunteer updating process: ", err.message);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred: ", err.message);
            }
        });
    }

    async deleteVolunteer(volunteerId) {
        return await global.DATA.CONNECTION.mysql.transaction(async (t) => {
            try {
                const volunteer = await volunteers.findOne({
                    where: { id: volunteerId },
                    transaction: t
                });

                if (!volunteer) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("NO VOLUNTEER EXISTS WITH GIVEN id");
                }

                if (volunteer.file_name) {
                    // Delete the file from S3
                    await deleteFile(volunteer.file_name, "VolunteerImgs");
                }

                const pab = await pabs.findOne({
                    where: {
                        id: volunteer.booth_id
                    },
                    transaction: t
                });

                const designationChecks = {
                    "PRESIDENT": "president",
                    "AGENT_1": "agent_1",
                    "AGENT_2": "agent_2"
                };

                const designation = volunteer.designation;

                if (volunteer.designation in designationChecks) {
                    const key = designationChecks[designation];
                    await pabs.update(
                        { no_volunteers: pab.no_volunteers - 1, [key]: "NOT FILLED" },
                        { where: { id: pab.id }, transaction: t }
                    );
                } else {
                    // Decrement the no_volunteers count in the pabs table
                    await pabs.decrement('no_volunteers', {
                        by: 1,
                        where: { id: volunteer.booth_id },
                        transaction: t
                    });
                }

                // Delete the volunteer record
                await volunteers.destroy({
                    where: { id: volunteerId },
                    transaction: t
                });

                return 'Volunteer deleted successfully';

            } catch (err) {
                console.error("Error during volunteer deleting process", err.message);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(err.message || Constants.SQL_ERROR);
            }
        });
    }


}

module.exports = UserService;