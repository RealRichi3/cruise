const initiateChat = async function (data, res) {
    try {
        
    } catch (error) {
        
    }
}

module.exports = (io, socket) => {
    const res = (error, data) => {
        if (error) {
            socket.emit('location:error', { error });
        } else {
            socket.emit('location:success', { data });
        }
    }

}
