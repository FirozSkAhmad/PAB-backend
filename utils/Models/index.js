const fs = require('fs');
const path = require('path');

class MySqlModels {
    constructor() {

    }

    async loadModels() {

        const defineRelationships = () => {
            try {
                const { users, volunteers } = global.DATA.MODELS;

                if (!users || !volunteers) {
                    throw new Error("Models not found");
                }

                volunteers.belongsTo(users, { foreignKey: 'surveyor_id' });

                console.log("Relationships defined successfully");
            } catch (error) {
                console.error("Error defining relationships:", error);
            }
        }

        try {
            const modelDirectories = await fs.promises.readdir(__dirname);

            await Promise.all(modelDirectories.map(async directory => {
                const directoryPath = path.join(__dirname, directory);
                const stat = await fs.promises.stat(directoryPath);

                if (stat.isDirectory()) {
                    const files = await fs.promises.readdir(directoryPath);

                    files.forEach(file => {
                        const modelPath = path.join(directoryPath, file);
                        const model = require(modelPath);
                        console.log('model data:', model)
                        global.DATA.MODELS[model.name] = model;
                        global.DATA.MODELS[model.name].sync()
                    });
                }
            }));

            defineRelationships();

        } catch (err) {
            console.error('Error loading models:', err);
        }
    }

}

module.exports = MySqlModels;