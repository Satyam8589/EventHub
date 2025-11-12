# EventHub 🎟️

![EventHub Banner](https://github.com/Satyam8589/EventHub/blob/main/image.png?raw=true) 

A **modern event booking and ticketing web platform** built using **Next.js** and **Supabase**, designed to make event management, booking, and digital ticket generation effortless and secure.


## 🚀 Overview

EventHub allows users to browse, book, and manage events online. It supports digital tickets with QR codes, online payments via Razorpay, and seamless authentication and data storage through Firebase and Supabase.  
The platform also includes admin controls for event organizers to create, edit, and monitor event details, ticket sales, and user engagement.

---

## 🧩 Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS  
- **Backend / Database:** Supabase (PostgreSQL)  
- **Authentication:** Firebase Authentication  
- **Payments:** Razorpay integration  
- **Utilities:** Cloudinary (media), QRCode & QR-Scanner, Nodemailer (email)  
- **Deployment:** Vercel  

---

## ⚙️ Features

✅ User authentication (Sign up / Log in via Firebase)  
✅ Browse upcoming and ongoing events  
✅ Secure ticket booking with online payment (Razorpay)  
✅ Instant digital ticket generation with QR code  
✅ Email notifications for successful bookings  
✅ Admin dashboard to create and manage events  
✅ Analytics and database powered by Supabase  
✅ Responsive, modern UI with Tailwind CSS  


## 🧾 Available Scripts

| Command | Description |
|----------|-------------|
| `npm run dev` | Start the local dev server |
| `npm run build` | Build the production version |
| `npm run start` | Run production build |
| `npm run lint` | Lint code with ESLint |

---

## 💳 Database & Migrations

EventHub uses **Supabase** for database management.  
All migration SQL files are located in the `supabase_migrations/` directory.  
To apply migrations:

```bash
npx supabase db push
```

---

## ☁️ Deployment (Vercel)

1. Push your repository to GitHub.  
2. Log in to [Vercel](https://vercel.com) and import the repository.  
3. Add the same environment variables in **Vercel → Settings → Environment Variables**.  
4. Deploy and access your live app instantly.

---

## 🧰 Troubleshooting

- **Razorpay payments not working?** → Check `RAZORPAY_KEY_ID` and webhook configuration.  
- **Supabase connection issues?** → Verify `DATABASE_URL` and Supabase project API keys.  
- **Email not sent?** → Ensure `EMAIL_USER` and `EMAIL_PASS` credentials are valid.  

---

## 🤝 Contributing

Contributions are always welcome!  
To contribute:

1. Fork this repository  
2. Create a new branch (`feature/your-feature-name`)  
3. Commit your changes  
4. Push and create a pull request  

---

## 🪪 License

This project is licensed under the **MIT License**.  
You are free to use, modify, and distribute it with proper attribution.

---

## 🧡 Author

**Developed by:** Satyam Kumar Singh  
📧 Email: [satyamkumarsingh9898@gmail.com]

> _Building impactful digital experiences — one event at a time._

