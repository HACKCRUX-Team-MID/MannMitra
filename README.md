<div align="center">

# 🧠 MannMitra
### *Your AI-Powered Mental Wellness Companion*

<br/>

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_MannMitra-6366f1?style=for-the-badge&logoColor=white)](https://mann-mitra-nr1m9cngt-ishan-agrawals-projects-ab70ae3b.vercel.app/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://mann-mitra-nr1m9cngt-ishan-agrawals-projects-ab70ae3b.vercel.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<br/>

> 💜 *Mann Mitra means "Friend of the Mind" in Hindi — an empathetic AI companion designed to support your mental wellness journey every day.*

<br/>

---

</div>

## 🌐 Live Application

<div align="center">

### 👉 [**https://mann-mitra-nr1m9cngt-ishan-agrawals-projects-ab70ae3b.vercel.app/**](https://mann-mitra-nr1m9cngt-ishan-agrawals-projects-ab70ae3b.vercel.app/)

*Click the link above to try MannMitra live — no setup required!*

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📊 Dashboard
Get a bird's-eye view of your mental wellness. Visual mood trends, streak tracking, and daily summaries help you understand your emotional health at a glance.

</td>
<td width="50%">

### 📓 Journal
Express yourself freely with a guided journaling experience. Voice-to-text support makes it effortless to capture your thoughts on the go.

</td>
</tr>
<tr>
<td width="50%">

### 📈 Insights
Deep-dive analytics powered by your journaling data. Understand patterns in your mood, track long-term progress, and identify triggers.

</td>
<td width="50%">

### 🤖 AI Companion
Chat with an empathetic AI companion available 24/7. Get supportive responses, coping strategies, and guided reflections tailored to your emotional state.

</td>
</tr>
<tr>
<td width="50%">

### 🔮 Mood Prediction
Using TensorFlow.js, MannMitra predicts your future mood based on historical patterns — helping you stay proactive about your mental wellness.

</td>
<td width="50%">

### ⚙️ Settings & Themes
Personalize your experience with light/dark mode, notification preferences, and profile customization.

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + TypeScript |
| **Build Tool** | Vite 7 |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Animations** | Framer Motion |
| **Backend / Auth** | Supabase (PostgreSQL + Auth) |
| **AI / ML** | TensorFlow.js + Hugging Face Transformers |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |
| **Routing** | React Router DOM v7 |
| **Deployment** | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>= 18`
- A [Supabase](https://supabase.com) project with the required tables

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/MannMitra.git
cd MannMitra

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your Supabase URL and anon key in .env

# 4. Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory with the following:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📁 Project Structure

```
MannMitra/
├── src/
│   ├── components/
│   │   ├── app/          # App-level components (Nav, Header, AI Chat)
│   │   └── ui/           # Reusable shadcn UI components
│   ├── pages/            # Route-level pages
│   │   ├── Dashboard.tsx
│   │   ├── Journal.tsx
│   │   ├── Insights.tsx
│   │   ├── Companion.tsx
│   │   ├── MoodPrediction.tsx
│   │   └── Settings.tsx
│   ├── context/          # React Context (Auth, Theme, etc.)
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utilities and Supabase client
├── mannmitra_app/        # Flutter mobile app (Android/iOS)
├── public/               # Static assets
└── package.json
```

---

## 📱 Mobile App

MannMitra also includes a **Flutter mobile app** (`mannmitra_app/`) for Android and iOS, providing the same wellness features in a native mobile experience.

```bash
# Navigate to the Flutter app
cd mannmitra_app/silent_spiral

# Install Flutter dependencies
flutter pub get

# Run the app
flutter run
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. 🍴 Fork the repository
2. 🌿 Create your feature branch: `git checkout -b feature/amazing-feature`
3. 💾 Commit your changes: `git commit -m 'Add some amazing feature'`
4. 📤 Push to the branch: `git push origin feature/amazing-feature`
5. 🔃 Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

### Made with 💜 for mental wellness

*If MannMitra helped you, please consider giving it a ⭐ on GitHub!*

[![Live Demo](https://img.shields.io/badge/🚀_Try_It_Live-MannMitra-6366f1?style=for-the-badge)](https://mann-mitra-nr1m9cngt-ishan-agrawals-projects-ab70ae3b.vercel.app/)

</div>
