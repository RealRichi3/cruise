wsClients = {
    // email: connection
}

function removeClient(connection) {
    console.log('Removing client: ', connection.id);
    delete wsClients[connection.userid]
}

function addClient(connection) {
    console.log('Adding client: ', connection.id);
    wsClients[connection.id] = connection;
}

module.exports = {
    removeClient,
    addClient,
    wsClients
}
