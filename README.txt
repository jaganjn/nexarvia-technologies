NEXARVIA TECHNOLOGIES — FINAL DEPLOYMENT PACKAGE

PAGES
- index.html: Common corporate homepage, mission, vision and division gateway.
- learning.html: Nexarvia Learning only. Browser refresh returns to index.html.
- technology-services.html: Nexarvia Technology Services only. Browser refresh returns to index.html.
- login.html / admin.html: Authenticated administration.

TECHNOLOGY SERVICE ENQUIRIES
- Firebase path: technologyServiceInquiries
- Admin dashboard: Business Enquiries
- Excel export: Export CSV from the admin dashboard
- Google Sheets: deploy google-sheets-technology-enquiries.gs and paste its Web App /exec URL into site-config.js

BEFORE DEPLOYMENT
1. Publish firebase-rules.json in Firebase Realtime Database Rules.
2. Add the Google Sheets Web App URL to site-config.js when ready.
3. Upload the contents of this folder to the existing repository.
4. Test Learning applications, Technology Service enquiries, admin login, announcements and mobile navigation on the live domain.
