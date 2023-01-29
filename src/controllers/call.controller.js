const config = require('../config/config')

const getSignallingId = async (req, res, next) => {
    return res.status(200).send({
        signallingId: config.SERVER_SIGNALLING_ID,
    })
}

const getCallLogs = async (req, res, next) => {
}

module.exports = {
    getSignallingId,
    getCallLogs,
}
