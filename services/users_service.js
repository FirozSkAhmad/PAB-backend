const Constants = require('../utils/Constants/response_messages')
const JWTHelper = require('../utils/Helpers/jwt_helper')
const { uploadFile, deleteFile } = require("../AWS/aws");


class UserService {
    constructor() {
        this.jwtObject = new JWTHelper();
    }

    async loginUser(userDetails) {
        try {

            let user = await global.DATA.MODELS.users.findOne({
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
                accessToken, "id": user.id, "email": user.emailId, "role_type": user.roleType, "user_name": user.user_name, "phn_no": user.phn_no
            }
            return data
        }
        catch (err) {
            throw err;
        }
    }

    async createUser(userdetails, files) {
        try {

            if (files.length === 0 || files[0].fieldname !== "profileImage") {
                throw new Error("required profileImage as key and file as value");
            }

            if (!["image/png", "image/jpg", "image/jpeg"].includes(files[0].mimetype)) {
                throw new Error("Only .png, .jpg and .jpeg format allowed!");
            }

            let uploadedFileURL = await uploadFile(files[0], "VolunteerImgs");

            // If present in the userstatus table or users table: email already exists
            const checkInUserStatus = await global.DATA.MODELS.userstatus.findOne({
                where: {
                    emailId: userdetails.emailId
                }
            }).catch(err => {
                console.log("Error during checking user", err.message)
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
            })

            const checkInUsers = await global.DATA.MODELS.users.findOne({
                where: {
                    emailId: userdetails.emailId
                }
            }).catch(err => {
                console.log("Error during checking user", err.message)
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
            })

            if (checkInUsers) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("EMAIL ID ALREADY PRESENT")
            }
            if (checkInUserStatus) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("You Might Not Approved Yet !")
            }

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

            const newUser = await global.DATA.MODELS.userstatus.create(userPayload).catch(err => {
                console.log("Error while adding in userstatus table", err.message);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
            });

            return newUser;
        }
        catch (err) {
            throw new global.DATA.PLUGINS.httperrors.InternalServerError(err.message);
        }
    }

    async volunteerOnboard(userdetails, files) {
        return await global.DATA.CONNECTION.mysql.transaction(async (t) => {
            try {
                if (files.length === 0 || files[0].fieldname !== "profileImage") {
                    throw new Error("required profileImage as key and file as value");
                }

                if (!["image/png", "image/jpg", "image/jpeg"].includes(files[0].mimetype)) {
                    throw new Error("Only .png, .jpg and .jpeg format allowed!");
                }

                let uploadedFileURL = await uploadFile(files[0], "VolunteerImgs");

                const pab = await global.DATA.MODELS.pabs.findOne({
                    where: {
                        parliment: userdetails.parliment,
                        assembly: userdetails.assembly,
                        booth: userdetails.booth,
                    },
                    transaction: t
                });

                await global.DATA.MODELS.pabs.update(
                    { no_volunteers: pab.no_volunteers + 1 },
                    { where: { id: pab.id }, transaction: t }
                );

                const Payload = {
                    surveyor_id: userdetails.surveyor_id,
                    parliment: userdetails.parliment,
                    assembly: userdetails.assembly,
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

                const newVolunteer = await global.DATA.MODELS.volunteers.create(Payload, { transaction: t });

                return newVolunteer;
            } catch (err) {
                console.error("Error during volunteer onboard process", err.message);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(err.message || Constants.SQL_ERROR);
            }
        });
    }

    async getVolunteersData(surveyorId) {
        try {
            const volunteers = await global.DATA.MODELS.volunteers.findAll({
                where: {
                    surveyor_id: surveyorId
                },
                order: [['updatedAt', 'DESC']] // Sorting by updatedAt in descending order
            });

            return volunteers

        } catch (error) {
            console.error('Error fetching volunteers:', error);
            res.status(500).send('Internal Server Error');
        }
    }

    async volunteerUpdate(volunteerId, userdetails, files) {

        return await global.DATA.CONNECTION.mysql.transaction(async (t) => {
            try {

                const volunteer = await global.DATA.MODELS.volunteers.findOne({
                    where: {
                        id: volunteerId,
                    },
                    transaction: t
                });

                let updatedBoothId
                if (volunteer.parliment !== userdetails.parliment || volunteer.assembly !== userdetails.assembly || volunteer.booth !== userdetails.booth) {
                    const pab = await global.DATA.MODELS.pabs.findOne({
                        where: {
                            parliment: volunteer.parliment,
                            assembly: volunteer.assembly,
                            booth: volunteer.booth,
                        },
                        transaction: t
                    });

                    await global.DATA.MODELS.pabs.update(
                        { no_volunteers: pab.no_volunteers - 1 },
                        { where: { id: pab.id }, transaction: t }
                    );

                    const newPab = await global.DATA.MODELS.pabs.findOne({
                        where: {
                            parliment: userdetails.parliment,
                            assembly: userdetails.assembly,
                            booth: userdetails.booth,
                        },
                        transaction: t
                    });

                    await global.DATA.MODELS.pabs.update(
                        { no_volunteers: newPab.no_volunteers + 1 },
                        { where: { id: newPab.id }, transaction: t }
                    );

                    updatedBoothId = newPab.id
                }
                else {
                    updatedBoothId = volunteer.id
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
                    parliment: userdetails.parliment,
                    assembly: userdetails.assembly,
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

                const updatedVolunteer = await global.DATA.MODELS.volunteers.update(updatedObj, {
                    where: { id: volunteerId }
                });

                if (updatedVolunteer[0] === 0) { // Check if the update was successful
                    throw new Error("Volunteer not found or no changes made.");
                }

                return 'Volunteer updated successfully'

            } catch (err) {
                console.error("Error during volunteer updating process", err.message);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(err.message || Constants.SQL_ERROR);
            }
        });
    }

    async deleteVolunteer(volunteerId) {
        return await global.DATA.CONNECTION.mysql.transaction(async (t) => {
            try {
                const volunteer = await global.DATA.MODELS.volunteers.findOne({
                    where: { id: volunteerId },
                    transaction: t
                });
    
                if (!volunteer) {
                    throw new Error("Volunteer not found");
                }
    
                if (volunteer.file_name) {
                    // Delete the file from S3
                    await deleteFile(volunteer.file_name, "VolunteerImgs");
                }
    
                // Decrement the no_volunteers count in the pabs table
                await global.DATA.MODELS.pabs.decrement('no_volunteers', {
                    by: 1,
                    where: { id: volunteer.booth_id },
                    transaction: t
                });
    
                // Delete the volunteer record
                await global.DATA.MODELS.volunteers.destroy({
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