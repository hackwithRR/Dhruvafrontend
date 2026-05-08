import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export default function LogoutButton() {
    const handleLogout = async () => {
        await signOut(auth);
        window.location.href = "/login";
    };

    return (
        <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded"
        >
            Logout
        </button>
    );
}