wsClients = {
    // email: connection
}

clientIndexes = {

}

clients = []
index = 0;

function removeClient(connection) {
    console.log('Removing client: ', connection.id);
    const cli_index = clientIndexes[connection.id];
    clients.splice(cli_index, 1);
    index--;

    delete wsClients[connection.id]

}

function addClient(connection) {
    console.log('Adding client: ', connection.id);
    wsClients[connection.id] = connection;

    clientIndexes[connection.id] = index;
    index++;

    clients.push(connection);
}

module.exports = {
    removeClient,
    addClient,
    wsClients,
    clients,
    clientIndexes
}
