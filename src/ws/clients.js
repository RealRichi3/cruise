const clients = new Map();

const addClient = (socket) => {
    clients.set(socket.user.email, socket);
};

const removeClient = (socket) => {
    clients.delete(socket.user.email);
    console.log(clients.keys())
};

module.exports = {
    removeClient,
    addClient,
    clients,
};
