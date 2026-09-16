(() => {
  const form = document.getElementById('club-contact-form');
  const topic = document.getElementById('contact-topic');
  if (!form || !topic) return;

  document.querySelectorAll('[data-contact-topic]').forEach(link => {
    link.addEventListener('click', () => {
      const wanted = link.dataset.contactTopic;
      if (wanted) topic.value = wanted;
    });
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const subjectTopic = topic.value.trim() || 'General enquiry';
    const message = document.getElementById('contact-message').value.trim();

    const subject = `Sutton CC enquiry - ${subjectTopic}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Enquiry: ${subjectTopic}`,
      '',
      'Message:',
      message,
      '',
      'Sent via the Sutton Cricket Club website.'
    ].join('\n');

    window.location.href = `mailto:suttoncricketclub01@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
