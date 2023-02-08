const { Rider } = require("../models/users.model")

const goOnline = async function (req, res, next) {
    const rider = await Rider.findOne({user: req.user.id})
    
    // Select car
    const result = await rider.goOnline()

    if (result instanceof Error) throw result;

    res.status(200).json({
        success: true,
        data: result
    })
}

const goOffline = async function (req, res, next) {
    const rider = await Rider.findOne({user: req.user.id})
    
    // Select car
    const result = await rider.goOffline()

    if (result instanceof Error) throw result;

    res.status(200).json({
        success: true,
        data: result
    })
}

module.exports = {
    goOnline,
    goOffline
}
