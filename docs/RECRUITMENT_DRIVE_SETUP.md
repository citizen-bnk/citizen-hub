# Private recruitment uploads

The Hub accepts applicant PDF CV/reference files and JPEG/PNG identity photos (maximum 3 MB each), sends bytes to Google Drive and stores only file IDs/links and metadata. No document bytes are stored in Postgres. Guests use an expiring HttpOnly application capability, not a Citizen session; uploaded metadata belongs to that draft until verified account access is established. Photos are not sent to CitizenAI or used for automated facial matching.

Configure these server-only Vercel environment variables in the Hub project:

- `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`: credentials for an explicitly authorised Citizen Google Drive connection. Do not reuse the research connector or paste credentials in chat.
- `GOOGLE_DRIVE_RECRUITMENT_FOLDER_ID`: a private folder within the Citizen Digital recruitment records, writable by that connection and accessible only to authorised recruitment reviewers.
- `GOOGLE_DRIVE_RECRUITMENT_DEMO_FOLDER_ID`: a different private folder for demonstration uploads. Demonstration documents must not be mixed with real applicant records.

Use Google's documented OAuth consent and offline access process. For the least-privilege `drive.file` scope, the selected folder must have been explicitly granted to this connection (for example through Google Picker) or created by the connection. A folder path in the local Drive sync client does not grant API access.

The server checks the parent is a writable folder and refuses folders with public (`anyone`) or domain-wide permissions. It never changes sharing permissions to make applicant files public. Review any group permissions manually to ensure group membership is restricted to recruitment personnel. Applicant download/review access through Drive requires their appropriate Google identity; uploading and submission do not require the applicant to have a Drive account.

Unconfigured or expired connections show a specific recovery message; no file is falsely reported as saved. Structured answers can be submitted with missing evidence clearly pending. Offers on new applications require verified contact, a CV, selfie and ID photo. Pending files remain in Drive if the applicant abandons a form, or the metadata write fails after Drive saves the file. Administrators must establish retention, restricted reviewer access and correction/withdrawal handling before collecting real identity evidence; there is no automatic permanent deletion.

End-to-end upload verification requires an authorised connection and both folders. Unit checks verify the size/type/magic-byte policy, and production checks verify session protection and the unconfigured-state response. A successful real Drive upload is not claimed until that connection is supplied and tested.

References: [Google Drive upload guide](https://developers.google.com/workspace/drive/api/guides/manage-uploads), [Google OAuth offline access](https://developers.google.com/identity/protocols/oauth2/web-server#offline).
