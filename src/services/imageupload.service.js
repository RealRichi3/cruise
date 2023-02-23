const { BadRequestError } = require('../utils/errors');
const uploadToCloudinary = require('../middlewares/cloudinary').uploadtocloudinary;

const uploadSingleFile = async (file, data) => {
    let localfilepath = file.path;
    let originalname = file.originalname;
    let uploadresult = await uploadToCloudinary(localfilepath, originalname, data);
    if (uploadresult.message === 'error') {
        throw new BadRequestError(uploadresult.message);
    }
    if (uploadresult.message === 'success') {
        return uploadresult.url;
    }
};

const uploadFiles = async (req, type, data) => {
    const files = req.files[type];
    if (!files || !files.length) {
        throw new BadRequestError(`${ type } is required`);
    }
    const results = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadSingleFile(file, data);
        results.push(result);
    }
    // console.log(results)
    if (results.length === 0) {
        throw new BadRequestError(`Error uploading ${ type } to cloudinary`);
    }
    return results;
}

const uploadvehicleimages = async (req, res, next) => {
    const data = {
        folder: 'vehicleimages',
        id: req.body.plate_number,
    };
    const bufferarray = await uploadFiles(req, 'images', data);
    const banner = req.files.banner[0];
    const banneruploadresult = await uploadSingleFile(banner, data);
    if (banneruploadresult.message === 'error') {
        return next(new BadRequestError(banneruploadresult.message));
    }
    return {
        banner: banneruploadresult,
        images: bufferarray,
    };
};

const uploadProfile = async (req, res, next) => {
    const data = {
        folder: 'profileimages',
        id: req.body.user.id,
    };
    const bufferarray = await uploadFiles(req, 'profileDocs', data);
    const img = req.files.profileImg;
    const imguploadresult = await uploadSingleFile(img, data);
    if (imguploadresult.message === 'error') {
        return next(new BadRequestError(imguploadresult.message));
    }
    return {
        profileImg: imguploadresult,
        profileDocs: bufferarray,
    };
};

module.exports = {
    uploadvehicleimages,
    uploadProfile,
};