# 🚀 How to Run AidLink AI

Since we are now using a **Django Backend** and a **React Frontend**, you need to run two separate servers.

### 1. Start the Backend (Django)
This handles the database and AI logic.

1.  Open a **new terminal**.
2.  Navigate to the project folder:
    ```powershell
    cd c:\Users\revan\OneDrive\Desktop\CIH\aidlink-ai
    ```
3.  Activate the virtual environment:
    ```powershell
    backend\venv\Scripts\activate
    ```
4.  Go into the backend folder:
    ```powershell
    cd backend
    ```
5.  Run the server:
    ```powershell
    python manage.py runserver
    ```
    *It should say: "Starting development server at http://127.0.0.1:8000/"*

---

### 2. Start the Frontend (React)
This runs the website interface.

1.  Open **another new terminal**.
2.  Navigate to the project folder:
    ```powershell
    cd c:\Users\revan\OneDrive\Desktop\CIH\aidlink-ai
    ```
3.  Run the dev server:
    ```powershell
    npm run dev
    ```
    *It will show a URL (e.g., http://localhost:5173).*

---

### 3. Open the App
Go to **http://localhost:5173** (or the URL shown in the frontend terminal).

> **Note:** If you see "Network Error" or AI doesn't reply, check that the **Backend Terminal** is still running and shows requests coming in.
