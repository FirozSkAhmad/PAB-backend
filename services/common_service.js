const Constants = require('../utils/Constants/response_messages')
const JWTHelper = require('../utils/Helpers/jwt_helper')
const Sequelize = require('sequelize');


class CommonService {
    constructor() {
        this.jwtObject = new JWTHelper();
    }

    async getAllParliments() {
        try {
            const uniqueParliamentsData = await global.DATA.MODELS.pabs.findAll(
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

    async assembliesByParliament(parlimentName) {
        try {
            const assembliesData = await global.DATA.MODELS.pabs.findAll({
                attributes: ['assembly'],
                where: {
                    parliment: parlimentName
                },
                group: ['assembly'] // Group by 'assembly' to get unique values
            })
                .catch(err => {
                    console.log("Error while reading the assembly details", err.message);
                    throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
                })


            const assemblies = assembliesData.map(a => a.assembly);

            return assemblies
        }
        catch (err) {
            throw err;
        }
    }

    async getBooths(parlimentName, assemblyName) {
        try {
            const boothsData = await global.DATA.MODELS.pabs.findAll({
                attributes: ['booth'],
                where: {
                    parliment: parlimentName,
                    assembly: assemblyName
                },
                group: ['booth'],
                order: [['id', 'ASC']]
            })
                .catch(err => {
                    console.log("Error while reading the booth-address details", err.message);
                    throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
                })

            const booths = boothsData.map(b => b.booth);

            return booths
        }
        catch (err) {
            throw err;
        }
    }


    async getBoothAddress(parlimentName, assemblyName, boothName) {
        try {
            const boothsData = await global.DATA.MODELS.pabs.findOne({
                attributes: ['address'],
                where: {
                    parliment: parlimentName,
                    assembly: assemblyName,
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