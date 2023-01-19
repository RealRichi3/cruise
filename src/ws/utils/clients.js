const clients = new Map();
const { User } = require('../../models/users.model');

async function removeClient(connection) {
    console.log("Removing client: ", connection.id);
    clients.delete(connection.id);
    console.log(connection.id)

    const user = await User.findOne({ email: connection.user.email }).populate('rider');
    console.log(user)
    user.rider.isOnline = false;
    
    await user.rider.save();
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
