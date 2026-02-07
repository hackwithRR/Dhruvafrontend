import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { useState } from "react";

export default function ProfilePhotoUpload({ user }) {
    const [photoURL, setPhotoURL] = useState(user.photoURL || "");

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        // Update user profile photo in Firebase
        await updateProfile(user, { photoURL: url });

        setPhotoURL(url);
        console.log("Profile photo URL:", url);
        alert("Profile photo updated!");
    };

    return (
        <div className="flex flex-col items-center mt-4">
            <img
                src={photoURL || "https://via.placeholder.com/100"}
                alt="Profile"
                className="w-24 h-24 rounded-full mb-2"
            />
            <input type="file" onChange={handleUpload} />
        </div>
    );
}