const alert_window = document.querySelector('.alert');
const alert_close = document.querySelector('.btn-close');

window.onload = () => {
    alert_window.classList.add('hide');
    alert_window.classList.remove('show');
}

function show_alert() {
    console.log('show alert')
    alert_window.classList.remove('hide')
    alert_window.classList.add('show');

    const yes_btn = document.querySelector('.yes');
    const no_btn = document.querySelector('.no');

    yes_btn.addEventListener('click', () => {
        socket.emit('ride:accepted', { accepted: true });
        close_alert();
    })
    no_btn.addEventListener('click', () => {
        socket.emit('ride:rejected', { accepted: false });
        close_alert();
    })
    alert_close.addEventListener('click', () => {
        close_alert();
    });
}

function close_alert() {
    alert_window.classList.add('hide');
    alert_window.classList.remove('show');
}

const init_chat = document.querySelector('.initiate-chat');
const send_message = document.querySelector('.send-message');
const message_content = document.querySelector('.message-content');
const target_email = document.querySelector('.target-mail');

const api_url = 'http://localhost:5000/api/v1';
let chat_room_id = null;
init_chat.addEventListener('click', async function () {
    console.log('init chat')
    const response = await axios.get(api_url + '/user/user-data', {
        params: {
            target_email: target_email.value
        }
    })

    const { data } = response;
    const user_data = data.data.user;

    console.log(user_data)
    
    function initiateChatResponseHandler(data) {
        console.log('intiating chat')
        socket.removeEventListener('chat:success', initiateChatResponseHandler)
        chat_room_id = data.data.chat_room_id;

        console.log('chat room id: ', chat_room_id)
    }
    socket.on('chat:success', initiateChatResponseHandler);
    socket.emit('chat:initiate', {
        targetuser_id: user_data._id
    });
});

send_message.addEventListener('click', () => {
    console.log(message_content.value)
    console.log(socket)
    
    function sendMessageResponseHandler (data) {
        console.log('send message response handler')
        console.log(data)
    }
    socket.on('chat:success', sendMessageResponseHandler);
    socket.emit('chat:message:new', {
        message: message_content.value,
        chat_room_id
    });
});
