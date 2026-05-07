
# Certificate Generator System 🎓

A full‑stack automated certificate generation system with an admin panel.  
Input participant details, and the system instantly creates a beautifully designed, downloadable certificate in **PDF** and **PNG** format, each with a unique certificate ID.

---

## Features

- 📝 **Simple Admin Panel** – Secure login, easy form to generate certificates.
- 📄 **Dual Format Output** – Every certificate is generated as **PDF** and **PNG**.
- 🔑 **Unique Certificate ID** – Auto‑generated, collision‑free `CERT-XXXXXXXX` identifier.
- 📊 **Management Dashboard** – View all issued certificates with download links.
- ⚡ **Ready‑to‑Run** – Uses SQLite (no external DB setup required), works out of the box.

---

## Tech Stack

| Layer          | Technology               |
|----------------|--------------------------|
| Backend        | Node.js + Express        |
| Admin Page     | EJS + Bootstrap 5        |
| Database       | SQLite3                  |
| File Generation| Puppeteer (HTML → PDF/Image) |
| Authentication | Session‑based (bcrypt)   |

---

## Project Structure

 
cert-gen/
├── package.json
├── server.js                 # Main Express application
├── db.js                     # SQLite setup & seed
├── utils/
│   └── generator.js          # Puppeteer logic (PDF + PNG)
├── views/
│   ├── login.ejs             # Admin login page
│   ├── dashboard.ejs         # Admin dashboard (form + table)
│   └── template.html         # Certificate HTML template
└── public/
    └── generated/            # Auto‑created, stores PDF & PNG files
 

---

## Getting Started

### Prerequisites

- **Node.js** v16 or higher
- **npm** (comes with Node.js)

### Installation

1. **Clone or download** this repository.
2. Open a terminal inside the project folder and run:
    bash
   npm install
    
   > This will install all dependencies, including Puppeteer (which downloads Chromium automatically).

3. **Start the server**:
    bash
   npm start
    
   The server will start on **http://localhost:3000**.

---

## Usage

### Admin Login

1. Navigate to **http://localhost:3000/admin/login**
2. Use the default credentials:
   - **Username:** `admin`
   - **Password:** `admin123`

*(You can change the password by modifying the seeding logic in `db.js`, or directly in the SQLite database.)*

### Generate a Certificate

After logging in, you’ll land on the dashboard where you can:

- Fill in **Full Name**, **Role** (e.g., Intern, Participant), **Event/Internship Name**, and **Date**.
- Click **Generate Certificate**.
- The certificate appears instantly in the table, with **PDF** and **PNG** download buttons.

### Download Certificates

- **PDF**: `http://localhost:3000/api/certificates/<CERT-ID>/download/pdf`
- **PNG**: `http://localhost:3000/api/certificates/<CERT-ID>/download/image`

These links are also available directly on the dashboard for every certificate.

---

## Customisation

### Certificate Design

Edit the HTML template in **`views/template.html`**. The following placeholders are automatically replaced:

- `{{full_name}}`
- `{{role}}`
- `{{event_name}}`
- `{{event_date}}`
- `{{cert_id}}`

You can change fonts, colours, or add logos. The current design uses Google Fonts (Great Vibes + Montserrat) and a clean border layout.

### Admin Credentials

To change the default admin password, edit the `db.js` file. Look for the line:
 js
const hash = bcrypt.hashSync('admin123', salt);
 
Replace `'admin123'` with your desired password. The database will be reseeded on next run.

---

## API Endpoints

| Method | Endpoint                                   | Description                     |
|--------|--------------------------------------------|---------------------------------|
| GET    | `/admin/login`                             | Admin login page               |
| POST   | `/admin/login`                             | Authenticate admin             |
| GET    | `/admin/dashboard`                         | Admin dashboard (protected)    |
| GET    | `/admin/logout`                            | Logout                         |
| GET    | `/api/certificates`                        | List all certificates (JSON)   |
| POST   | `/api/certificates`                        | Generate new certificate       |
| GET    | `/api/certificates/:cert_id/download/pdf`  | Download PDF certificate       |
| GET    | `/api/certificates/:cert_id/download/image`| Download PNG certificate       |

---

## Skills Demonstrated

- **Backend Logic** – RESTful API design, session authentication.
- **File Generation** – Dynamic PDF/Image creation with Puppeteer.
- **Automation** – Unique ID generation, collision handling, ready for batch processing.
- **Admin Panel** – Full‑stack integration using EJS and Express.

---
