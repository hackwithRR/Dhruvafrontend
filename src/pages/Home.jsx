// frontend/src/pages/Home.jsx
import { Link } from "react-router-dom";

function Home() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-400 to-purple-600 text-white">
            <h1 className="text-4xl font-bold mb-6">Welcome to AI Tutor</h1>
            <div className="space-x-4">
                <Link
                    to="/login"
                    className="px-5 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:scale-105 transform transition"
                >
                    Login
                </Link>
                <Link
                    to="/chat"
                    className="px-5 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:scale-105 transform transition"
                >
                    Chat
                </Link>
            </div>
        </div>
    );
}

export default Home;