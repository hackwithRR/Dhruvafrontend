# Firestore missing-index fix (what to do)

Your app is throwing:
`FirebaseError: [code=failed-precondition]: The query requires an index.`

This is not a code bug—you must create the missing composite index in Firebase.

## Steps
1. Copy the **Create index** URL shown in the error toast/log.
   - It looks like:
     `https://console.firebase.google.com/.../firestore/indexes?create_composite=...`
2. Open that URL in your browser.
3. Click **Create index**.
4. Wait for index building to finish (Firebase will show build progress).
5. Refresh/reload the app.

## Most likely query
From the repo:
- `src/components/TicketsSection.jsx`
- Query:
  - `where('createdBy', '==', userId)`
  - `orderBy('createdAt', 'desc')`
This combination typically requires a composite index on `issues`.

## Confirmation
Once the index exists, the `onSnapshot` listener should stop erroring and the tickets list should load normally.
