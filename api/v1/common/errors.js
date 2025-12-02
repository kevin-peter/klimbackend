class InputError extends Error {
    constructor(message) {
        super(message)
        this.name = "InputError"
        this.statusCode = 400
        Error.captureStackTrace(this, InputError)
    }
}

class AuthError extends Error {
    constructor(message) {
        super(message)
        this.name = "AuthError"
        this.statusCode = 403
        Error.captureStackTrace(this, AuthError)
    }
}

module.exports = {
    InputError,
    AuthError
}