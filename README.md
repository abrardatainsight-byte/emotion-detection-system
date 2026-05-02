# Lumora: Real-Time Emotion Detection System

Lumora is a state-of-the-art organizational sentiment analysis platform. It utilizes deep learning to provide human resources and management with real-time, privacy-first insights into employee well-being.

By leveraging a Vision Transformer (ViT) architecture, Lumora categorizes facial expressions into distinct emotional states without requiring persistent video streams, ensuring a secure and unobtrusive experience for the talent.

## 🚀 Tech Stack

### Frontend (User Interface)
* **Framework:** React + Vite
* **Routing:** React Router DOM
* **HTTP Client:** Axios
* **Styling:** Custom inline CSS (Premium UI/UX)
* **Features:** Role-based access control (HR vs. Employee), active polling architecture, and dynamic data visualization.

### Backend (API & Deep Learning)
* **Framework:** FastAPI
* **Server:** Uvicorn
* **Database:** SQLite (managed via SQLAlchemy ORM)
* **Machine Learning:** PyTorch & Hugging Face `transformers`
* **Model:** Pre-trained Vision Transformer (`dima806/facial_emotions_image_detection`)
* **Features:** CORS middleware, RESTful endpoints, and in-memory image processing.

## 📁 Repository Structure

The project is divided into two distinct environments to ensure clean separation of concerns:

* `/frontend`: Contains the React/Vite application. Handles the HR Dashboard, the Employee camera portal, and all user interactions.
* `/backend`: Contains the FastAPI Python server. Handles database management, trigger states, and the Deep Learning inference pipeline.

## ⚙️ Quick Start

For comprehensive, step-by-step instructions on setting up the environment, installing dependencies, and running the full end-to-end test, please refer to the primary documentation:

📖 **[Read the Full User Guide (Lumora_User_Guide.md)](./Lumora_User_Guide.md)**

### TL;DR Boot Sequence:
If your environments are already configured, start the system via:
1. **Backend:** `cd backend` → `.\venv\Scripts\activate` → `uvicorn main:app --reload`
2. **Frontend:** `cd frontend` → `npm run dev`

---
*Developed for enterprise environment deployment. Deep learning models run locally to ensure absolute data privacy.*