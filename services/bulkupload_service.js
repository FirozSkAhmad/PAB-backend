const fs = require('fs');
const csv = require('csv-parser');
const stream = require('stream');

class BulkUpload {
    constructor() {

    }
    async processCsvFile(buffer) {
        return new Promise((resolve, reject) => {
            const results = [];

            // Create a readable stream from the buffer
            const bufferStream = new stream.PassThrough();
            bufferStream.end(buffer);

            bufferStream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    try {
                        const message = await this.uploadBulkData(results);
                        resolve(message);
                    } catch (error) {
                        console.error('Error in uploadBulkSalesData:', error);
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    console.error('Error reading the file:', error);
                    reject(error);
                });
        });
    }

    async uploadBulkData(data) {
        let successfulAdditions = 0;

        try {

            await global.DATA.CONNECTION.mysql.transaction(async (t) => {
                for (let i = 0; i < data.length; i++) {
                    const item = data[i];

                    // Create PAB
                    await global.DATA.MODELS.pabs.create({
                        parliment: item['Parliment Constituency'],
                        assembly: item['Assembly Constituency'],
                        booth: item['Polling booths'],
                        address: item['Address']
                    }, { transaction: t });

                    successfulAdditions++;
                }
            });

            return {
                status: 200,
                message: `${successfulAdditions} PAB data added successfully.`
            };

        } catch (error) {
            console.error('Error processing CSV file:', error);
            throw error;
        }
    }
}

module.exports = BulkUpload;