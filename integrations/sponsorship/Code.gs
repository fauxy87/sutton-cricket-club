/**
 * Sutton Cricket Club — sponsorship enquiry receiver.
 * Sheet: Sutton CC – 2027 Sponsorship Enquiries
 * Deploy as: Google Apps Script Web app, execute as Me, access Anyone.
 *
 * The public endpoint can be targeted by spam; inspect the sheet and inbox periodically.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1LJBzTZwYS-Pa3PPYNy-SD62Wu2ilGB6vps0qLRdoHgE',
  SHEET_NAME: '2027 Enquiries',
  NOTIFY_EMAIL: 'suttoncricketclub01@gmail.com',
  HOME_URL: 'https://www.suttoncambscc.co.uk/',
});

function doPost(e) {
  const data = (e && e.parameter) || {};
  // Honeypot field should be hidden from real visitors.
  if (data.website) return confirmation_();
  const name = clean_(data.Name, 120);
  const business = clean_(data.Business, 160);
  const email = clean_(data.email, 200);
  const phone = clean_(data.Phone, 80);
  const interest = clean_(data.Sponsorship_Interest, 240);
  const message = clean_(data.Message, 4000);

  if (!name || !business || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return html_('Please complete your name, business and a valid email address.');
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return html_('We could not save your enquiry. Please try again.');
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('Missing enquiries tab');
    // Match the header columns in the connected Google Sheet.
    // Prefix potentially formula-like input to prevent spreadsheet formula injection.
    sheet.appendRow([
      new Date(), cell_(business), cell_(name), cell_(email), cell_(phone),
      cell_(interest || 'Not sure yet'), 'New enquiry', 'Medium',
      '', '', '', '', cell_(message)
    ]);
  } finally {
    lock.releaseLock();
  }

  // Logging the enquiry is the primary operation. A notification failure
  // must not encourage the visitor to resubmit and create duplicate rows.
  try {
    MailApp.sendEmail({
      to: CONFIG.NOTIFY_EMAIL,
      subject: 'New Sutton CC sponsorship enquiry' + (business ? ' — ' + business : ''),
      body: [
        'A new sponsorship enquiry has been added to your 2027 Google Sheet.',
        '',
        'Name: ' + name,
        'Business: ' + business,
        'Email: ' + email,
        'Phone: ' + (phone || 'Not provided'),
        'Interested in: ' + (interest || 'Not sure yet'),
        '',
        'Message:',
        message || 'No additional message.',
        '',
        'Google Sheet: https://docs.google.com/spreadsheets/d/' + CONFIG.SPREADSHEET_ID + '/edit'
      ].join('\n'),
      replyTo: email
    });
  } catch (error) {
    console.error('Enquiry saved; email notification failed', error);
  }
  return confirmation_();
}

function clean_(value, maxLength) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, maxLength);
}
function cell_(value) {
  return /^[=+@-]/.test(value) ? "'" + value : value;
}
function html_(text) {
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Sutton Cricket Club sponsorship</title></head><body style="font:16px system-ui,sans-serif;' +
    'max-width:600px;margin:60px auto;padding:20px;text-align:center">' +
    '<h1>Sutton Cricket Club</h1><p>' + escape_(text) + '</p>' +
    '<p><a href="' + CONFIG.HOME_URL + '">Return to the club website</a></p></body></html>'
  ).setTitle('Sutton Cricket Club sponsorship');
}
function confirmation_() {
  return html_('Thank you. Your sponsorship enquiry has been received.');
}
function escape_(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[c]);
}
