const Constants = require('../utils/Constants/response_messages')
const JWTHelper = require('../utils/Helpers/jwt_helper')
const Sequelize = require('sequelize');
const pabs = require("../utils/Models/PAB/PABModel")


class CommonService {
    constructor() {
        this.jwtObject = new JWTHelper();
    }

    async getAllParliments() {
        try {
            const uniqueParliamentsData = await pabs.findAll(
                {
                    attributes: [
                        [Sequelize.fn('DISTINCT', Sequelize.col('parliment')), 'parliment'],
                    ],
                    where: {
                        parliment: {
                            [Sequelize.Op.ne]: null // Filter out null values if needed
                        }
                    }
                }
            )
                .catch(err => {
                    console.log("Error while reading the parliaments details", err.message);
                    throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
                })

            const uniqueParliaments = uniqueParliamentsData.map(p => p.parliment);

            return uniqueParliaments
        }
        catch (err) {
            throw err;
        }
    }

    async getAllAssemblies() {
        try {
            const uniqueAssembliesData = await pabs.findAll(
                {
                    attributes: [
                        [Sequelize.fn('DISTINCT', Sequelize.col('assembly')), 'assembly'],
                    ],
                    where: {
                        assembly: {
                            [Sequelize.Op.ne]: null // Filter out null values if needed
                        }
                    }
                }
            )
                .catch(err => {
                    console.log("Error while reading the Assemblies details", err.message);
                    throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
                })

            const uniqueAssemblies = uniqueAssembliesData.map(a => a.assembly);

            return uniqueAssemblies
        }
        catch (err) {
            throw err;
        }
    }

    async talukasByAssembly(assemblyName) {
        try {
            const talukasData = await pabs.findAll({
                attributes: ['taluka'],
                where: {
                    assembly: assemblyName
                },
                group: ['taluka'] // Group by 'taluka' to get unique values
            })
                .catch(err => {
                    console.log("Error while reading the assembly details", err.message);
                    throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
                })


            const talukas = talukasData.map(t => t.taluka);

            return talukas
        }
        catch (err) {
            throw err;
        }
    }

    async getBooths(assemblyName, talukaName) {
        try {
            const boothsData = await pabs.findAll({
                attributes: ['booth'],
                where: {
                    assembly: assemblyName,
                    taluka: talukaName
                },
                group: ['booth'],
                order: [['id', 'ASC']]
            })
                .catch(err => {
                    console.log("Error while reading the booth details", err.message);
                    throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
                })

            const booths = boothsData.map(b => b.booth);

            return booths
        }
        catch (err) {
            throw err;
        }
    }


    async getBoothAddress(assemblyName, talukaName, boothName) {
        try {
            const boothsData = await pabs.findOne({
                attributes: ['address'],
                where: {
                    assembly: assemblyName,
                    taluka: talukaName,
                    booth: boothName,
                },
            })
                .catch(err => {
                    console.log("Error while reading the booth-address details", err.message);
                    throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
                })

            return boothsData
        }
        catch (err) {
            throw err;
        }
    }
}
module.exports = CommonService;