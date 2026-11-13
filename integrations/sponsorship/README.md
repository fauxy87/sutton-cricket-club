# Sutton CC — Google Sheets sponsorship enquiries

The Google Sheet **Sutton CC – 2027 Sponsorship Enquiries** already exists:
https://docs.google.com/spreadsheets/d/1LJBzTZwYS-Pa3PPYNy-SD62Wu2ilGB6vps0qLRdoHgE/edit

The website currently submits to FormSubmit and emails the club. Do **not** change the live website until you have deployed and tested this endpoint.

## Deploy (needs the Google account with edit access to the sheet)

1. Open https://script.google.com/home/projects/create in the Google account used for the sheet.
2. Name the project `Sutton CC Sponsorship Enquiries`.
3. Replace the default `Code.gs` content with `integrations/sponsorship/Code.gs` from this repository. Save.
4. In **Deploy → New deployment → Web app**, select **Execute as: Me** and **Who has access: Anyone**. Authorise the requested Google Sheets and email permissions for your own account.
5. Copy the Web app URL ending in `/exec` and share it privately with the website administrator / assistant for integration. This URL is a public form submission endpoint, not a password.
6. Change `sponsor-enquiry.html` form action from `https://formsubmit.co/suttoncricketclub01@gmail.com` to the deployed `/exec` URL. Keep `method="POST"`. Add honeypot: `<div style="position:absolute;left:-9999px" aria-hidden="true"><label>Leave this blank<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>`.
7. Remove the obsolete FormSubmit hidden `_subject`, `_template`, `_next`, `_captcha` inputs. The deployed script serves its own success page and sends the club an email.
8. Test one enquiry and verify a new row appears in `2027 Enquiries` with status `New enquiry`, plus an email in the club inbox. Check the selected 150th-anniversary option survives the site's query-parameter preselection.
9. If it fails, restore the FormSubmit action and hidden inputs; the original email-based form should remain usable.

**Security/operations:** The Google Sheet itself remains private; only the Apps Script deployment is publicly callable. Anyone with the URL can submit, so the honeypot is only basic protection and the endpoint may receive spam. Apps Script quotas apply. Restrict spreadsheet sharing, monitor the inbox, and do not put Google login credentials or secret keys in site source code. The script sanitises strings and escapes spreadsheet formula prefixes.

**Integration status:** Script prepared; Google Apps Script deployment and final website cutover not yet performed.
