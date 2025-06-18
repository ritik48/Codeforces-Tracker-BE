## Codeforces Tracker Backend

This is the backend for the Codeforces Tracker project [Frontend](https://github.com/ritik48/Codeforces-Tracker-FE).

## Setting up the project locally

To get started with the project, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/ritik48/Codeforces-Tracker-BE.git
```

2. Navigate to the project directory:

```bash
cd Codeforces-Tracker-BE
```

3. Install the dependencies:

```bash
npm install
```

4. Create a `.env` file in the root directory and add the following variables:

```bash
MONGODB_URI=mongodb://localhost:27017/tle_cf_management
JWT_EXPIRY=10d
TOKEN_SECRET=samplesecret
RESEND_API_KEY=your_resend_api_key
EMAIL_SENDER_EMAIL=your_email
EMAIL_SENDER_DOMAIN=your_email_domain
```

5. Run tsc in watch mode to compile the TypeScript files:

```bash
tsc -w
```

6. Start the server:

```bash
npm run dev
```

7. Create a new user in the MongoDB database using the seeder script:

```bash
node dist/seeder.js <username> <password>
```

## API Documentation

**🔐 Auth routes:**

| Method | Endpoint  | Description              | Auth | Body / Query           | Response (summary)         |
| ------ | --------- | ------------------------ | ---- | ---------------------- | -------------------------- |
| POST   | `/login`  | Logs in a user           | ❌   | `username`, `password` | `{ success, message }`     |
| POST   | `/logout` | Logs out current user    | ✅   | -                      | `{ success, message }`     |
| GET    | `/user`   | Get current user profile | ✅   | -                      | `{ username, email, ... }` |


<br>
<br>

⚙️ **Cron Routes:**

| Method | Endpoint | Description                 | Auth | Body                | Response                 |
| ------ | -------- | --------------------------- | ---- | ------------------- | ------------------------ |
| GET    | `/cron`  | Get current cron expression | ✅   | -                   | `{ success, cron_time }` |
| PATCH  | `/cron`  | Update cron job time        | ✅   | `cron_time: string` | `{ success, message }`   |

<br>
<br>

🎓 **Student Routes:**

| Method | Endpoint                       | Description                     | Auth | Notes                    |
| ------ | ------------------------------ | ------------------------------- | ---- | ------------------------ |
| GET    | `/student`                     | Fetch all students              | ✅   |                          |
| POST   | `/student`                     | Create a new student            | ✅   | Pass full student object |
| GET    | `/student/:id`                 | Get student by ID               | ✅   |                          |
| PATCH  | `/student/:id`                 | Update student                  | ✅   |                          |
| PATCH  | `/student/:id/email`           | Update student email            | ✅   |                          |
| DELETE | `/student/:id`                 | Delete student                  | ✅   |                          |
| GET    | `/student/:id/contest-history` | Fetch student's contest history | ✅   |                          |
| GET    | `/student/:id/submission-data` | Fetch student's submission data | ✅   |                          |
| GET    | `/student/download`            | Download all student data       | ✅   | Returns CSV or JSON      |
