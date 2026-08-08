/**
 * Nexarvia Technology Services — Google Sheets Web App
 * 1. Create a Google Sheet named "Nexarvia Technology Services Enquiries".
 * 2. Extensions → Apps Script → paste this file.
 * 3. Deploy → New deployment → Web app.
 * 4. Execute as: Me. Access: Anyone.
 * 5. Copy the /exec URL into technologyInquirySheetEndpoint in site-config.js.
 */
const SHEET_NAME = 'Technology Services Enquiries';
const HEADERS = ['Enquiry Reference','Submitted Date','Customer Name','Company / Organisation','Business Email','Phone Number','Location','Required Service','Project Type','Budget Range','Expected Timeline','Preferred Contact Method','Requirement Details','Communication Consent','Enquiry Status','Source'];
function doPost(e){
  try{
    const data=JSON.parse(e.postData.contents||'{}');
    const ss=SpreadsheetApp.getActiveSpreadsheet();
    const sheet=ss.getSheetByName(SHEET_NAME)||ss.insertSheet(SHEET_NAME);
    if(sheet.getLastRow()===0) sheet.appendRow(HEADERS);
    sheet.appendRow([data.reference||'',data.submittedAt||new Date().toISOString(),data.fullName||'',data.organisation||'',data.email||'',data.phone||'',data.location||'',data.service||'',data.projectType||'',data.budget||'',data.timeline||'',data.preferredContact||'',data.requirements||'',Boolean(data.consent),data.status||'new',data.source||'technology-services-page']);
    return ContentService.createTextOutput(JSON.stringify({ok:true,reference:data.reference||''})).setMimeType(ContentService.MimeType.JSON);
  }catch(error){return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(error)})).setMimeType(ContentService.MimeType.JSON);}
}
function doGet(){return ContentService.createTextOutput('Nexarvia Technology Services enquiry connector is active.');}
