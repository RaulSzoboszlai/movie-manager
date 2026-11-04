export function notFound(req, res) {
    res.status(404).json({ message: 'Not found' });
}

export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const status = err.status ?? err.statusCode;
    if (Number.isInteger(status) && status >= 400 && status <= 499) {
        return res.status(status).json({ message: err.message });
    }

    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
}
