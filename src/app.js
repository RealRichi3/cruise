const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const errorHandler = require('./middlewares/error_handler')

const app = express()

// Middlewares
if (process.env.NODE_ENV == 'dev') {
    app.use(morgan('dev'))
}

app.use(cors())
app.use(express.json())
app.use(require('express-async-error').Handler())

// Routes
app.use('/api/v1/auth', require('./routes/auth.route'))

// Error handler middleware
app.use(errorHandler)
app.use((req, res, next) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`,
    })
})

module.exports = app
