# Lumora: Real-Time Emotion Detection System
## End-to-End Client User Guide

Welcome to the **Lumora Emotion Detection System**. This enterprise-grade platform utilizes state-of-the-art Deep Learning (Vision Transformers) to analyze organizational sentiment in real-time. It is designed to provide powerful HR insights while strictly maintaining employee privacy.

---

### 1. System Overview
* **The AI Engine:** Powered by a pre-trained Hugging Face Vision Transformer (`dima806/facial_emotions_image_detection`), capable of accurately classifying emotions (Happy, Neutral, Stress, Drowsiness).
* **The Backend:** A high-performance FastAPI Python server with a lightweight SQLite database.
* **The Frontend:** A modern, interactive React dashboard built with Vite.
* **Privacy First:** Employees never see their own video feed, preventing monitoring fatigue. Images are snapped momentarily, processed in memory, and immediately discarded.

---

### 2. How to Start the System
*Note: Ensure you are running these commands in two separate terminal windows (e.g., Windows PowerShell).*

#### Terminal 1: Start the AI Backend
1. Open your terminal and navigate to the backend folder:
   ```powershell
   cd backend
   .\venv\Scripts\activate
   uvicorn main:app --reload

(Wait until you see Application startup complete before proceeding)


#### Terminal 2: Start the UI Frontend
2. Open a new terminal window and navigate to the frontend folder:
   ```powershell
   cd frontend
   npm run dev

(This will run the frontend on http://localhost:5173/)


#### Usage Flow
3. Step-by-Step Usage Flow
To test the system end-to-end, it is best to open two browser windows side-by-side (use an Incognito/Private window for one of them to keep the sessions separate).

>>> Step 1: Employee Registration & Setup (Window 1)
1. Go to http://localhost:5173/employee/login
2. Click "Need an account? Register".
3. Ensure the toggle is set to Employee.
4. Enter a test Username (e.g., staff_01) and Password, then click Register.
5. When the browser asks for Camera Permissions, click Allow.
6. You will see a clean, static "Welcome" screen stating that monitoring is active. (Leave this window open and visible).

>>> Step 2: HR Dashboard Login (Window 2)
1. Go to http://localhost:5173/hr/login
2. Click "Need an account? Register" (if this is your first time) or simply login.
3. Ensure the toggle is set to HR Admin.
4. Enter your HR Username and Password, then click Register/Login.
5. You will arrive at the Global Pulse dashboard, which will show your active talent count.

>>> Step 3: Running the Live Analysis
1. Sit in front of the Employee window (Window 1) and make a distinct facial expression (e.g., a large smile or a stressed frown).
2. While holding the expression, go to the HR Dashboard (Window 2) and click the "Run Live Analysis" button in the top right corner.
3. The button will switch to "Processing Streams...". The backend is now silently capturing a frame, running it through the Vision Transformer neural network, and saving the result.

>>> Step 4: Viewing the Deep Learning Results
1. Once the 4-second processing finishes, click on the Insight Hub tab on the HR Dashboard.
2. The data table will instantly populate with the employee's username, their live AI-detected vibe (color-coded for quick visual triage), and the exact time of the sync.

#### Troubleshooting
1. "Invalid Credentials" on Login: If you recently wiped or restarted the backend database (emotion_system.db), all accounts are erased. Simply click "Register" to create your HR and Employee accounts again.
2. "ERR_CONNECTION_REFUSED" in Browser: Your frontend server is off. Ensure npm run dev is actively running in the frontend terminal.
3. Camera Not Working: Ensure no other application (like Zoom or Teams) is currently using your webcam, and check that your browser hasn't blocked camera access in the URL bar.
4. Slow First Run: The very first time you start the backend, it will download the Vision Transformer model (~340MB). This requires an internet connection and may take a minute or two depending on your network speed. Subsequent runs will load instantly from your local cache.