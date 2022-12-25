const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5555;

/* JWT TOKENS */
const JWT_SECRET = process.env.JWT_ACCESS_SECRET,
    JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET,
    JWT_SECRET_EXP = process.env.JWT_ACCESS_EXP,
    JWT_ACCESS_EXP = process.env.JWT_ACCESS_EXP,
    JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXP = process.env.JWT_REFRESH_EXP,
    JWT_PASSWORDRESET_SECRET = process.env.JWT_PASSWORDRESET_SECRET,
    JWT_PASSWORDRESET_EXP = process.env.JWT_PASSWORDRESET_EXP,
    JWT_EMAILVERIFICATION_SECRET = process.env.JWT_EMAILVERIFICATION_SECRET,
    JWT_EMAILVERIFICATION_EXP = process.env.JWT_EMAILVERIFICATION_EXP;

/* EMAIL and OAUTH2*/
const EMAIL_HOST = process.env.EMAIL_HOST,
    EMAIL_PORT = process.env.EMAIL_PORT,
    EMAIL_HOST_ADDRESS = process.env.EMAIL_HOST_ADDRESS,
    OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET,
    OAUTH_REFRESH_TOKEN = process.env.OAUTH_REFRESH_TOKEN,
    OAUTH_ACCESS_TOKEN = process.env.OAUTH_ACCESS_TOKEN,
    GOOGLE_SIGNIN_CLIENT_ID = process.env.GOOGLE_SIGNIN_CLIENT_ID,
    GOOGLE_SIGNIN_CLIENT_SECRET = process.env.GOOGLE_SIGNIN_CLIENT_SECRET,
    GOOGLE_SIGNIN_REDIRECT_URI = process.env.GOOGLE_SIGNIN_REDIRECT_URI,
    SUPER_ADMIN_EMAIL1 = process.env.SUPER_ADMIN_EMAIL1,
    SUPER_ADMIN_EMAIL2 = process.env.SUPER_ADMIN_EMAIL2;

module.exports = {
    MONGO_URI,
    PORT,
    JWT_SECRET,
    JWT_SECRET_EXP,
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    JWT_ACCESS_EXP,
    JWT_REFRESH_EXP,
    JWT_PASSWORDRESET_SECRET,
    JWT_PASSWORDRESET_EXP,
    JWT_EMAILVERIFICATION_SECRET,
    JWT_EMAILVERIFICATION_EXP,
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_HOST_ADDRESS,
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    OAUTH_REFRESH_TOKEN,
    OAUTH_ACCESS_TOKEN,
    GOOGLE_SIGNIN_CLIENT_ID,
    GOOGLE_SIGNIN_CLIENT_SECRET,
    GOOGLE_SIGNIN_REDIRECT_URI,
    SUPER_ADMIN_EMAIL1,
    SUPER_ADMIN_EMAIL2,
};
