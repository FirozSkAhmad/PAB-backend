const Constants = require('../utils/Constants/response_messages')
const { Op } = require('sequelize')
const { uploadFile } = require('../AWS/aws')

class AdminService {
    constructor() {

    }

    async createSuperAdmin(userdetails, files) {
        try {

            if (files.length === 0 || files[0].fieldname !== "profileImage") {
                throw new Error("required profileImage as key and file as value");
            }

            if (!["image/png", "image/jpg", "image/jpeg"].includes(files[0].mimetype)) {
                throw new Error("Only .png, .jpg and .jpeg format allowed!");
            }

            let uploadedFileURL = await uploadFile(files[0], "AdminImg");

            const password = userdetails.password;

            const randomkey = await global.DATA.PLUGINS.bcrypt.genSalt(10);
            const hashedPassword = await global.DATA.PLUGINS.bcrypt.hash(password, randomkey)

            const userPayload = {
                emailId: userdetails.emailId,
                password: hashedPassword,
                user_name: userdetails.user_name,
                phn_no: userdetails.phn_no,
                address: userdetails.address,
                photo_url: uploadedFileURL,
                role_type: userdetails.role_type,
            }
            const newUser = global.DATA.MODELS.users.create(userPayload).catch(err => {
                console.log("Error while adding in users table", err.message);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
            });
            return newUser
        }
        catch (err) {
            throw err.message;
        }
    }

    async getUsersList() {
        try {
            const data = await global.DATA.MODELS.userstatus.findAll()
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

    async validateUser(userDetails) {
        try {

            if (userDetails.status === 'R') {

                await global.DATA.CONNECTION.mysql.transaction(async (t) => {

                    // Get the details from the userstatus table
                    const data = await global.DATA.MODELS.userstatus.findOne({
                        where: {
                            emailId: userDetails.emailId
                        },
                        transaction: t
                    }).catch(err => {
                        console.log(err);
                        throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                    })

                    // Add to the rejectedusers table
                    await global.DATA.MODELS.rejectedusers.create({
                        emailId: data.emailId,
                        password: data.password,
                        user_name: data.user_name,
                        phn_no: data.phn_no,
                        address: data.address,
                        photo_url: data.photo_url,
                        role_type: userDetails.role_type,
                    }, {
                        transaction: t
                    }).catch(err => {
                        console.log(err);
                        throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                    })

                    //Delete from the userstatus table
                    await global.DATA.MODELS.userstatus.destroy({
                        where: {
                            emailId: userDetails.emailId
                        },
                        transaction: t
                    }).catch(err => {
                        throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                    })

                })
            }

            if (userDetails.status === 'V') {
                // Delete from the user status and add to the user table
                await global.DATA.CONNECTION.mysql.transaction(async (t) => {

                    // Get the details from the userstatus table
                    const data = await global.DATA.MODELS.userstatus.findOne({
                        where: {
                            emailId: userDetails.emailId
                        },
                        transaction: t
                    }).catch(err => {
                        console.log(err);
                        throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                    })

                    // Add to the users table
                    await global.DATA.MODELS.users.create({
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
                    await global.DATA.MODELS.userstatus.destroy({
                        where: {
                            emailId: userDetails.emailId
                        },
                        transaction: t
                    }).catch(err => {
                        throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                    })

                })
            }
            return "STATUS UPDATED SUCCESSFULLY"
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

    async getOverview() {
        try {
            const Red = await global.DATA.MODELS.pabs.count({
                where: { no_volunteers: 0 }
            }).catch(err => {
                console.log("Error while reading the noVolunteersZero", err.message);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
            })

            const Yellow = await global.DATA.MODELS.pabs.count({
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

            const Green = await global.DATA.MODELS.pabs.count({
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
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

    async getVolunteersData() {
        try {
            const volunteers = await global.DATA.MODELS.volunteers.findAll({
                include: [{
                    model: global.DATA.MODELS.users,
                    attributes: ['user_name', 'emailId', 'phn_no']
                }],
                order: [['updatedAt', 'DESC']]  // Order by 'updatedAt' in descending order
            });
    
            // Process the results to format as per requirements
            const formattedVolunteers = volunteers.map(volunteer => {
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
            console.error("Error while fetching volunteers data:", err.message);
            throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
        }
    }    
}

module.exports = AdminService;