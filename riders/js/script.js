const alert_window = document.querySelector('.alert');
const alert_close = document.querySelector('.btn-close');

window.onload = () => {
    alert_window.classList.add('hide');
    alert_window.classList.remove('show');

}    

function show_alert() {
    alert_window.classList.remove('hide')
    alert_window.classList.add('show');

    const yes_btn = document.querySelector('.yes');
    const no_btn = document.querySelector('.no');
    
    yes_btn.addEventListener('click', () => {
        wss.broadcast('ride:request_response', { accepted: true });
        close_alert();
    })
    no_btn.addEventListener('click', () => {
        wss.broadcast('ride:request_response', { accepted: false });
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


