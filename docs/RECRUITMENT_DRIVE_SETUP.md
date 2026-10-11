# Private recruitment uploads

The Hub accepts applicant PDF uploads (maximum 3 MB), sends the bytes to Google Drive and stores only the resulting Drive file ID/link and document metadata. No document bytes are stored in Postgres. CV and references are uploaded inside the one-question application journey; existing application links remain valid.

Configure these server-only Vercel environment variables in the Hub project:

- `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`: credentials for an explicitly authorised Citizen Google Drive connection. Do not reuse the research connector or paste credentials in chat.
- `GOOGLE_DRIVE_RECRUITMENT_FOLDER_ID`: a private folder within the Citizen Digital recruitment records, writable by that connection and accessible only to authorised recruitment reviewers.
- `GOOGLE_DRIVE_RECRUITMENT_DEMO_FOLDER_ID`: a different private folder for demonstration uploads. Demonstration documents must not be mixed with real applicant records.

Use Google's documented OAuth consent and offline access process. For the least-privilege `drive.file` scope, the selected folder must have been explicitly granted to this connection (for example through Google Picker) or created by the connection. A folder path in the local Drive sync client does not grant API access.

The server checks the parent is a writable folder and refuses folders with public (`anyone`) or domain-wide permissions. It never changes sharing permissions to make applicant files public. Review any group permissions manually to ensure group membership is restricted to recruitment personnel. Applicant download/review access through Drive requires their appropriate Google identity; uploading and submission do not require the applicant to have a Drive account.

Unconfigured or expired connections show a specific recovery message; no file or application is falsely reported as saved. Pending uploads remain in Drive if the applicant abandons a form, or the metadata write fails after Drive saves the file. Administrators should reconcile such unsubmitted documents against their retention policy; there is no automatic permanent deletion.

End-to-end upload verification requires an authorised connection and both folders. Unit checks verify the size/type/magic-byte policy, and production checks verify session protection and the unconfigured-state response. A successful real Drive upload is not claimed until that connection is supplied and tested.

References: [Google Drive upload guide](https://developers.google.com/workspace/drive/api/guides/manage-uploads), [Google OAuth offline access](https://developers.google.com/identity/protocols/oauth2/web-server#offline).
