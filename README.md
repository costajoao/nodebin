# 📬 NodeBin

> Use NodeBin to collect all requests to a special URL which you can use to test your API Clients or your WebHooks.

NodeBin is a lightweight, self-hosted HTTP request collector — ideal for testing webhooks, HTTP clients, or any service that sends HTTP requests. Create a temporary bin and inspect request payloads in real time, either via UI or programmatically via its RESTful API. This project is inspired by the original [postbin](https://postb.in) project.

## 🚀 Features

- 🔗 Unique bin URLs that accept any HTTP method
- 🧪 View headers, query params, and request body
- 📈 Live tail mode with auto-scroll
- 📦 RESTful API to create bins and fetch requests
- 🗑️ Bins expire automatically after 30 minutes
- 🧼 Minimal and portable — runs on SQLite and Bun.js
- 🎨 Clean, responsive UI built with Tailwind CSS

## 🖥️ Demo

> Coming soon — deployable link or video here.

## 📦 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/costajoao/postbin.git
cd postbin
```

### 2. Install dependencies

```bash
bun install
```

### 3. Run the server

```bash
bun start
```

By default, NodeBin runs on [http://localhost:3001](http://localhost:3001)

## 🧪 Example Usage

Create a new bin:

```bash
curl -X POST http://localhost:3001/api/bin
```

Send a request to your bin:

```bash
curl http://localhost:3001/abc123
```

Fetch all requests:

```bash
curl http://localhost:3001/api/bin/abc123/requests
```

See full [API documentation](http://localhost:3001/api) in the UI.

## 🧰 Tech Stack

- **Backend:** Bun.js, SQLite
- **Frontend:** Vanilla JS, Tailwind CSS
- **Database:** SQLite (in-memory by default)

## 📂 Project Structure

```
.
├── db.js              # SQLite schema and setup
├── index.js           # Main Bun app
├── views/             # EJS templates
├── public/            # Static files (CSS, favicon)
├── routes/            # API + frontend routes
└── README.md
```

## 📄 License

[NodeBin](LICENSE) is MIT licensed.

## ⭐️ Support

If you find this project useful, consider giving it a star! ⭐
