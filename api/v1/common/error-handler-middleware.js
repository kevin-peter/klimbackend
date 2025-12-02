const errorHandlerMiddleware = async (err, req, res, next) => {
  if (err) {
    // delegate to error logging
    //console.error(err.stack);

    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Something went wrong",
      error: err.message || err,
    });
  }
}

module.exports = {
  errorHandlerMiddleware
}