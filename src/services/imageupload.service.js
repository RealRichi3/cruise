const { BadRequestError, UnauthenticatedError, UnauthorizedError } = require('../utils/errors');
const uploadtocloudinary = require('../middlewares/cloudinary').uploadtocloudinary;
// check for file upload

const vehicleimages = async (req, res, next) => {

    if (!req.files.length > 5) {
        return next(new BadRequestError('You can only upload 5 images'));
    }
    var bufferarray = [];
    const data = {
        folder: 'vehicleimages',
        id: req.body.plate_number
    };
    for (let i = 0; i < req.files.length; i++) {
        var localfilepath = req.files[i].path;
        var originalname = req.files[i].originalname;
        var uploadresult = await uploadtocloudinary(localfilepath, originalname, data);
        // check for success response
        if (uploadresult.message === 'error') {
            return next(new BadRequestError(uploadresult.message));
        }
        if (uploadresult.message === 'success') {
            bufferarray.push(uploadresult.url);
        }
    }
    if (bufferarray.length === 0) {
        return next(new BadRequestError("Error uploading images to cloudinary"));
    }
    return bufferarray;
};


module.exports = {
    vehicleimages
}
