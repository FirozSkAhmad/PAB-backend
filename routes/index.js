const BulkUploadController = require('../controller/bulkupload_controller')
const adminController = require('../controller/admin_controller')
const UserController = require('../controller/users_controller')
const CommonController = require("../controller/common_controller")


class IndexRoute {
    constructor(expressApp) {
        this.app = expressApp
    }

    async initialize() {
        this.app.use("/upload", BulkUploadController);
        this.app.use("/admin", adminController);
        this.app.use('/auth', UserController);
        this.app.use('/com', CommonController);
    }
}

module.exports = IndexRoute;