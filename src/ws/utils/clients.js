wsClients = []

function removeClient(connection) {
    const index = wsClients.indexOf(connection);
    if (index > -1) {
        wsClients.splice(index, 1);
    }
}

module.exports = {
    removeClient
}
