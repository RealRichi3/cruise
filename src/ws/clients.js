const clients = new Map();

const addClient = (socket) => {
    clients.set(socket.user.email, socket);
};

const removeClient = (socket) => {
    clients.delete(socket.user.email);
};

module.exports = {
    removeClient,
    addClient,
    clients,
};
