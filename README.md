# Getting Started

## 1. Install Dependencies

Install all required packages:

```bash
npm install
```

---

## 2. Environment Variables

In the root of the project, create a `.env` file and add your database connection string:

```env
DATABASE_URL="mysql://UserName:UserPassword@localhost:3306/pos_system"

NEXTAUTH_SECRET=super-long-random-secret
```

- Default MySQL port is **3306**
- Replace `UserName` and `UserPassword` with your own credentials
- You can use **any supported database**, not just MySQL

---

## 3. Prisma Setup

Run the following commands (whenever you make changes to `prisma.schema`):

```bash
npx prisma migrate dev --name migration_name
npx prisma generate
```

- `migration_name` should describe the change (e.g. `init`, `add_user`, `add_store`).
- Always import Prisma from the `lib/prisma` file:

```js
import prisma from "@/lib/prisma";
```

---

## 4. Run the Development Server

Start the server with:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You can edit the homepage by modifying `app/page.js`. Changes will hot-reload automatically.

---

# Database Seeding & Admin Setup

### Seed the Database

To seed the database and get some test data run the following commands.

```bash
npx prisma db seed
```

**Note**: if you get an error and your DB don't get seeded, DELETE the `migrations` folder inside prisma folder.

Run `npx prisma migrate reset --force` to remove the remaining prisma files and run `npx prisma migrate dev --name seed-db` then `npx prisma db seed`

This seeds the database and creates a default admin account:

- **Username:** `admin`
- **Password:** `admin123`

---

# Authentication Setup

This app uses a simple credentials-based authentication (username + password) with a session cookie that lasts until the browser is closed.

- Session is stored in an HTTP-only session cookie (no persistent Max-Age). Closing the browser logs the user out.
- Role-based access controls are enforced via middleware.

Environment variable:

```env
# Used to sign JWT session tokens
NEXTAUTH_SECRET=super-long-random-secret
```

---

## Signing In

Go to:

```
http://localhost:3000/login
```

Enter the default credentials:

- Username: `admin`
- Password: `admin123`

---

## Signing Out

To sign out, call the API:

```
POST http://localhost:3000/api/logout
```

Or invoke it from the UI if a Sign Out button is present. Closing the browser will also sign you out automatically.

---

# Testing API Endpoints

You can test all API endpoints directly in **Postman** using the collection below:

👉 [Postman Collection Link](https://planetary-firefly-715157.postman.co/workspace/Personal-Workspace~6d0c5a5b-be07-473e-94ce-71cce4abca4a/collection/27859111-58c2b949-baa7-4727-b5ea-9dd407164e5a?action=share&source=copy-link&creator=27859111)

```json
{
  "paymentMethod": "CASH",
  "taxAmount": 0,
  "customerId": 1,
  "totalAmount": 15100,
  "items": [
    {
      "barcode": "DSH5001",
      "discount": 0,
      "name": "Coca Cola 1L",
      "productId": 1,
      "quantity": 2,
      "subtotal": 50,
      "tempId": "item-968da8a0-c752-40ad-8ee2-638a89e077ea",
      "unitPrice": 50
    },
    {
      "barcode": "LSMSH1001",
      "discount": 0,
      "name": "Smartphone X",
      "productId": 3,
      "quantity": 1,
      "subtotal": 15000,
      "tempId": "item-b6bc289a-5702-4032-9f74-d7f25fdeece6",
      "unitPrice": 15000
    }
  ]
}
```
