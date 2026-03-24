const errorHandler = (error, _req, res, _next) => {
    process.stderr.write(`${error}\n`);
    let errCode = 500;
    let errMsg = '';
    if (error.expose) {
        errCode = error.status;
        errMsg = error.message;
    } else {
        switch (error.name) {
            case 'ValidationError':
            case 'CastError':
                errCode = 400;
                errMsg = error.message;
                break;
            case 'MongoServerError':
                if (error.code === 11000) {
                    errCode = 400;
                    errMsg = 'Already Exists';
                }
                break;
            default:
                break;
        }
    }
    res.status(errCode).send(errMsg);
};

module.exports = errorHandler;
