function socketWrapper(fn, socket) {
    return async function (data) {
        try {
            const res = await fn(data);
            return res;
        } catch (error) {
            socket.emit('error', error);
        }
    };
}

exports.socketWrapper = socketWrapper;
