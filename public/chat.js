new window.EventSource('/sse').onmessage = function (event) {
  window.messages.innerHTML += `<p>${event.data}</p>`;
};

window.form.addEventListener('submit', function (event) {
  event.preventDefault();
  const msg = window.input.value;
  if (msg.trim().length) {
    window.fetch(`/chat?message=${encodeURIComponent(msg.trim())}`);
  }
  window.input.value = '';
  window.input.focus();
});