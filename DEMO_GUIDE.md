# Demo & Defense Guide

Notes for the 5–7 minute demo. Run `schema.sql` first so the demo starts from clean sample data.

## Before you start

1. Run `server/schema.sql` (fresh sample data plus the `demo` / `demo123` account).
2. Terminal 1: `cd server && npm run dev`. Keep it visible so the logger lines show.
3. Terminal 2: `cd client && npm run dev`.
4. Open http://localhost:5173 with DevTools → Console open.
5. Thunder Client: save the requests below beforehand.

## Demo script (follows the instructor's checklist)

| # | Do this | Say this |
|---|---------|----------|
| 1 | Open the app | "The list comes from MySQL. `useFetch` runs a `useEffect` when the app opens." Point at `GET /api/polls -> 200` in the terminal. |
| – | Click **Create Poll** as a guest, then log in as `demo` | "Creating needs a login. The server checks the JWT. The Axios request interceptor attaches the token automatically." |
| 3 | Click **Create Poll** with the form empty, then type two matching options | "Each field shows its own error. Nothing was sent: no new line in the server log." |
| – | Type a topic and click **Generate with AI** | "The Gemini key is only on the server. React calls my Express route, and Express calls Gemini." |
| 2 | Pick a category and submit | "201 Created. The form resets, it opens the new poll with a success message, and it's already in the list because I added it with `setPolls(prev => [poll, ...prev])`." |
| – | Vote with a comment, then view the results | "The comment gets an AI sentiment label. The results show a margin of error, and an anomaly warning appears when votes come in bursts." |
| – | Generate AI Summary and try the duplicate detector | "The detector compares meanings using embeddings and cosine similarity." |
| 4 | Thunder Client: send a bad body | 400 with an `errors` object |
| 5 | Thunder Client: `GET /api/polls/9999` | 404 |
| 6 | Delete a poll from **My Polls** | "Removed from the UI with `filter`. In MySQL, `ON DELETE CASCADE` also removed its options and votes." Show `SELECT * FROM polls;` |
| 7 | Ctrl+C the server, run `npm run dev` again, then refresh | Data is still there. (Optional: refresh while it's stopped to show the "Cannot reach the server" error.) |
| 8 | Show the console | No CORS errors and no React warnings. A red 401/409 network line is only the browser logging the status code. |
| 9 | Show the repo | `.env` is in `.gitignore`. `.env.example` lists the variable names only. |

### Thunder Client requests

```
POST http://localhost:3000/api/auth/login
{ "usernameOrEmail": "demo", "password": "demo123" }
→ 200, copy the "token"

POST http://localhost:3000/api/polls
Header: Authorization: Bearer <token>
{ "question": "Hi", "options": [{ "text": "a" }, { "text": "A" }] }
→ 400 (question too short, no category, duplicate options)

POST http://localhost:3000/api/polls          (no Authorization header)
→ 401

GET    http://localhost:3000/api/polls/9999    → 404
GET    http://localhost:3000/api/polls/abc     → 400
POST   http://localhost:3000/api/polls/1/votes
{ "optionId": 2, "voterFingerprint": "voter_sample_1" }
→ 409 (that sample voter already voted)
POST   http://localhost:3000/api/polls/3/votes
{ "optionId": 7, "voterFingerprint": "voter_new_123" }
→ 409 (poll 3 is closed)
```

## Questions you might get

**"Walk me through creating a poll."**
`CreatePoll.handleSubmit` → `e.preventDefault()` → `validate(form)` → `createPoll()` in `api/index.js` → the Axios instance adds the token → Express: `cors` → `express.json` → `logger` → `readUser` → `requireLogin` → `createPoll` controller → `validatePoll` → `pollModel.create` (transaction, `?` placeholders) → `201` → React adds the poll to the list and opens it.

**"Why validate on the server too?"**
Anyone can skip the React form and call the API directly, as the Thunder Client test shows. The client check is for user experience. The server check is for security.

**"Why does the middleware order matter?"**
Middleware runs top to bottom. `express.json()` must come before the routes or `req.body` is undefined. `cors()` must add its headers before any route answers. `readUser` must set `req.user` before `requireLogin` checks it. The 404 and error handlers go last.

**"How does one `handleChange` handle several fields?"**
Each input's `name` matches a key in the `form` object. `setForm(prev => ({ ...prev, [name]: value }))` copies the object and replaces only that key.

**"What does the cleanup in `useFetch` do?"**
`controller.abort()` cancels the request if you leave the page or open a different poll before it finishes, so an old response can't overwrite new data.

**"How do you prevent SQL injection?"**
Every query uses `?` placeholders, and values are passed separately to `pool.execute`. User input is never joined into the SQL string.

**"How are passwords stored?"**
As bcrypt hashes (`bcrypt.hash(password, 10)`). Login uses `bcrypt.compare`. The real password is never saved.

**"How does login work?"**
The server signs a JWT with `JWT_SECRET` (from `.env`) containing the user id. React stores it in localStorage. The Axios request interceptor sends it as `Authorization: Bearer ...`, and `readUser` verifies it on every request.

**"Why call Gemini from Express instead of React?"**
Anything in React is visible in the browser, so the API key would leak. On the server it stays in `.env`.

**"How is one vote per voter enforced?"**
The browser makes a random voter id and keeps it in localStorage. MySQL has `UNIQUE (poll_id, voter_fingerprint)`, so a second insert fails with `ER_DUP_ENTRY`, which the controller turns into 409.

**"Explain the margin of error."**
It's a 95% confidence interval for a proportion: `1.96 × √(p(1−p)/n)`, where `p` is the option's share and `n` is the total number of votes. It's skipped under 5 votes.

**"Explain the anomaly detector."**
It groups votes by minute, then computes the average and standard deviation of votes per minute. Any minute above average + 3 standard deviations is flagged. It needs at least 20 votes.

**"Why `return res.status(...)`?"**
`return` stops the function, so the handler can't send a second response.

**"What's a transaction?"**
Creating a poll is several INSERTs (the poll plus each option). If any of them fails, `rollback()` undoes all of them.
