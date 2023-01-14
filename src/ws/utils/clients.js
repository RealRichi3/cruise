const clients = new Map();

function removeClient(connection) {
    console.log("Removing client: ", connection.id);
    clients.delete(connection.id);
}

function addClient(connection) {
    console.log("Adding client: ", connection.id);
    clients.set(connection.id, connection);
}

module.exports = {
    removeClient,
    addClient,
    clients,
};
