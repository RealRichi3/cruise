const { default: mongoose } = require('mongoose');
const schema = mongoose.Schema;

const uploadStatusSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        isVerified: { type: Boolean, default: false },
        isUploaded: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const profileuploadSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        image: { type: String, required: true },
    },
    { timestamps: true }
);

const userdocSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        docurl: { type: String, required: true },
        docname: { type: String, required: true },
        docnumber: { type: String, required: true },
        docexpiry: { type: String, required: true },
        docstatus: { type: String, required: true },
    },
    { timestamps: true }
);

const vehicleimagesSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        vehicle: { type: schema.Types.ObjectId, ref: 'Vehicle', required: true },
        imagearray: { type: Array, required: true },
    },
    { timestamps: true }
);

const vehicledocsSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        vehicle: { type: schema.Types.ObjectId, ref: 'Vehicle', required: true },
        docArray: { type: Array, required: true },
    },
    { timestamps: true }    
);

// virtuals
uploadStatusSchema.virtual('user', {
    ref: 'User',
    localField: 'user',
    foreignField: '_id',
    justOne: true,
});

// check image type before saving
profileuploadSchema.pre('save', function (next) {
    if (!this.image || this.image.startsWith('data:image')) {
        next();
    } else {
        next(new Error('Invalid image type'));
    }
});

// check doc type before saving
userdocSchema.pre('save', function (next) {
    if (!this.docurl || this.docurl.startsWith('data:application')) {
        next();
    } else {
        next(new Error('Invalid document type'));
    }
});

// check array doc type before saving
// vehicleimagesSchema.pre('save', function (next) {
//     if (!this.imagearray || this.imagearray.startsWith('data:image')) {
//         next();
//     } else {
//         next(new Error('Invalid image type'));
//     }
// });


const UploadStatus = mongoose.model('UploadStatus', uploadStatusSchema);
const ProfileUpload = mongoose.model('ProfileUpload', profileuploadSchema);
const UserDoc = mongoose.model('UserDoc', userdocSchema);
const VehicleImages = mongoose.model('VehicleImages', vehicleimagesSchema);
const VehicleDocs = mongoose.model('VehicleDocs', vehicledocsSchema);

module.exports = {  
    UploadStatus,
    ProfileUpload,
    UserDoc,
    VehicleImages,
    VehicleDocs
};
