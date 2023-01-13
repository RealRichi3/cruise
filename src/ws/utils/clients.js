wsClients = {
    // email: connection
}

function removeClient(connection) {
    console.log('Removing client: ', connection.id);
    delete wsClients[connection.id]
}

function addClient(connection) {
    console.log('Adding client: ', connection.id);
    if (wsClients[connection.id]) {
        console.log('Client already exists');
        return new Error('Client already exists');
    }
    wsClients[connection.id] = connection;
}

module.exports = {
    removeClient,
    addClient,
    wsClients
}
