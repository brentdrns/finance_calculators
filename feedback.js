/* Site feedback box.
 * Usage: put <div id="siteFeedback"></div> where the box should go (usually just before the footer)
 * and load this file: <script src="feedback.js" defer></script>
 * Messages are sent to the Formspree form below, which forwards them by email.
 * Uses the page's own colour variables (--surface, --surface2, --border, --text, --text-muted, --accent).
 */
(function () {
  var ENDPOINT = 'https://formspree.io/f/xnjbenlg';
  var mount = document.getElementById('siteFeedback');
  if (!mount || mount.dataset.ready) return;
  mount.dataset.ready = '1';

  if (!document.getElementById('siteFeedbackCSS')) {
    var css = document.createElement('style');
    css.id = 'siteFeedbackCSS';
    css.textContent =
      '.feedback-section{max-width:680px;margin:40px auto 56px;padding:0 24px;box-sizing:border-box}' +
      '.feedback-section h2{font-family:"DM Serif Display",Georgia,serif;font-weight:400;font-size:22px;color:var(--text);margin:0 0 6px}' +
      '.feedback-section .fb-intro{color:var(--text-muted);font-size:12px;margin:0 0 18px;line-height:1.6}' +
      '.feedback-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px 28px}' +
      '.fb-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}' +
      '.fb-field{display:flex;flex-direction:column;gap:4px;min-width:0}' +
      '.fb-field label{font-size:11px;color:var(--text-muted)}' +
      '.fb-field input,.fb-field textarea{box-sizing:border-box;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:Inter,system-ui,sans-serif;font-size:16px;padding:9px 11px;outline:none;transition:border-color .15s;width:100%}' +
      '@media (min-width:601px){.fb-field input,.fb-field textarea{font-size:13px}}' +
      '.fb-field input:focus,.fb-field textarea:focus{border-color:var(--accent)}' +
      '.fb-field textarea{resize:vertical;min-height:100px}' +
      '.fb-actions{display:flex;align-items:center;gap:12px;margin-top:14px;flex-wrap:wrap}' +
      '.fb-submit{background:var(--accent);color:#fff;border:none;border-radius:8px;font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:600;padding:10px 22px;cursor:pointer;transition:opacity .15s}' +
      '.fb-submit:hover{opacity:.88}.fb-submit:disabled{opacity:.55;cursor:default}' +
      '.fb-status{font-size:12px;color:var(--text-muted)}.fb-status.ok{color:#16a34a}.fb-status.err{color:#dc2626}' +
      '.fb-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}' +
      '@media (max-width:600px){.fb-row{grid-template-columns:1fr}.feedback-card{padding:16px 18px}.feedback-section{padding:0 12px}}';
    document.head.appendChild(css);
  }

  // page name for the email subject: data-page on the mount, else the <title> before " | " / " — "
  var page = String(mount.getAttribute('data-page') || document.title.split(/\s[|—–]\s/)[0]).trim() || location.pathname;

  mount.innerHTML =
    '<section class="feedback-section" aria-labelledby="fbTitle">' +
    '<h2 id="fbTitle">Send Feedback</h2>' +
    '<p class="fb-intro">Found a bug, have an idea, or want a feature or race added? Send a note straight to the person who builds these calculators. Name and email are optional; leave an email if you\'d like a reply.</p>' +
    '<div class="feedback-card"><form id="fbForm" novalidate>' +
    '<div class="fb-row">' +
    '<div class="fb-field"><label for="fbName">Name <span style="opacity:.6">(optional)</span></label><input type="text" id="fbName" name="name" placeholder="Your name" autocomplete="name" maxlength="120"></div>' +
    '<div class="fb-field"><label for="fbEmail">Email <span style="opacity:.6">(optional)</span></label><input type="email" id="fbEmail" name="email" placeholder="you@example.com" autocomplete="email" maxlength="200"></div>' +
    '</div>' +
    '<div class="fb-field"><label for="fbMessage">Message</label><textarea id="fbMessage" name="message" placeholder="What\'s on your mind?" required maxlength="5000"></textarea></div>' +
    '<div class="fb-hp" aria-hidden="true"><label for="fbGotcha">Leave this empty</label><input type="text" id="fbGotcha" name="_gotcha" tabindex="-1" autocomplete="off"></div>' +
    '<div class="fb-actions"><button type="submit" class="fb-submit" id="fbSubmit">Send Feedback</button><span class="fb-status" id="fbStatus" role="status" aria-live="polite"></span></div>' +
    '</form></div></section>';

  var form = document.getElementById('fbForm');
  var status = document.getElementById('fbStatus');
  var btn = document.getElementById('fbSubmit');
  function setStatus(text, cls) { status.textContent = text; status.className = 'fb-status' + (cls ? ' ' + cls : ''); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var message = document.getElementById('fbMessage').value.trim();
    var email = document.getElementById('fbEmail').value.trim();
    if (!message) { setStatus('Please write a message first.', 'err'); document.getElementById('fbMessage').focus(); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus('That email address doesn\'t look right. Fix it or leave it blank.', 'err'); document.getElementById('fbEmail').focus(); return; }
    var body = {
      name: document.getElementById('fbName').value.trim(),
      email: email,
      message: message,
      page: page,
      url: location.origin + location.pathname,
      _subject: 'Feedback: ' + page,
      _gotcha: document.getElementById('fbGotcha').value
    };
    btn.disabled = true;
    setStatus('Sending…');
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); })
      .then(function () { form.reset(); setStatus('✓ Thanks! Your message was sent.', 'ok'); })
      .catch(function () { setStatus('Sorry, that didn\'t send. Check your connection and try again.', 'err'); })
      .then(function () { btn.disabled = false; });
  });
})();
