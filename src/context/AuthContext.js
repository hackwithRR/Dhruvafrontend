import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider } from "../firebase"; 
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    signOut 
} from "firebase/auth"; 
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp, getDoc, collection, query, where, getDocs } from "firebase/firestore";



const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- LOGIN (Email/Password) ---
    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    // --- REGISTER (Email/Password) ---
    // UPDATED: Now accepts gender and avatarUrl to prevent blank profile fields
    const register = async (email, password, name, gender, avatarUrl) => {
        try {
            const res = await createUserWithEmailAndPassword(auth, email, password);
            const userDocRef = doc(db, "users", res.user.uid);
            
            // CRITICAL: We await this write so the profile exists before navigation
            await setDoc(userDocRef, {
                uid: res.user.uid,
                name: name,                // For Dhruva AI Backend
                displayName: name,         // For Firebase Auth UI
                email: res.user.email,
                pfp: avatarUrl,            // Selected Avatar from Register.jsx
                gender: gender,            // Selected Gender
                theme: "dark",             // Default Theme
                classLevel: "8",           // Default
                board: "ICSE",             // Default
                language: "English",       // Default
                createdAt: serverTimestamp()
            });
            
            return res;
        } catch (error) {
            throw error; 
        }
    };

    // --- GOOGLE LOGIN ---
    const googleLogin = async () => {
        try {
            const res = await signInWithPopup(auth, googleProvider);
            const userDocRef = doc(db, "users", res.user.uid);
            
            // merge: true ensures we don't overwrite existing data on returning users
            await setDoc(userDocRef, {
                uid: res.user.uid,
                displayName: res.user.displayName,
                name: res.user.displayName,
                email: res.user.email,
                pfp: res.user.photoURL,
                createdAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Google login failed", error);
        }
    };

    // --- LOGOUT ---
    const logout = () => signOut(auth);

    // --- THEME UPDATE ---
    const updateTheme = async (newTheme) => {
        if (!currentUser) return;
        try {
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, { theme: newTheme });
        } catch (error) {
            console.error("Error updating theme:", error);
        }
    };

    // --- PROGRESS TRACKING ---
    const markChapterComplete = async (subject, chapter) => {
        if (!currentUser) return;
        try {
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);
            const currentProgress = userSnap.data()?.progress || {};
            
            const subjectProgress = currentProgress[subject] || {
                totalChapters: 0,
                completedChapters: [],
                lastUpdated: null
            };
            
            if (!subjectProgress.completedChapters.includes(chapter)) {
                subjectProgress.completedChapters.push(chapter);
                subjectProgress.lastUpdated = serverTimestamp();
                
                await updateDoc(userRef, {
                    [`progress.${subject}`]: subjectProgress
                });
            }
        } catch (error) {
            console.error("Error marking chapter complete:", error);
        }
    };

    const getProgress = async () => {
        if (!currentUser) return null;
        try {
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);
            return userSnap.data()?.progress || {};
        } catch (error) {
            console.error("Error getting progress:", error);
            return null;
        }
    };

// --- ADMIN PHONE STATE (NEW) ---
const [adminPhoneVerified, setAdminPhoneVerified] = useState(false);

// --- PARENT VIEW FUNCTIONALITY ---
    const generateParentCode = async () => {
        if (!currentUser) return null;
        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, {
                parentCode: code,
                parentCodeCreatedAt: serverTimestamp()
            });
            return code;
        } catch (error) {
            console.error("Error generating parent code:", error);
            return null;
        }
    };

    const verifyParentCode = async (code) => {
        try {
            // Search for user with this parent code
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("parentCode", "==", code));
            const querySnap = await getDocs(q);
            
            if (!querySnap.empty) {
                const userDoc = querySnap.docs[0];
                return {
                    success: true,
                    studentData: {
                        name: userDoc.data().name || userDoc.data().displayName,
                        progress: userDoc.data().progress || {},
                        xp: userDoc.data().xp || 0,
                        streak: userDoc.data().streak || 0,
                        classLevel: userDoc.data().classLevel || userDoc.data().class,
                        board: userDoc.data().board
                    }
                };
            }
            return { success: false, error: "Invalid code" };
        } catch (error) {
            console.error("Error verifying parent code:", error);
            if (error?.code === "permission-denied") {
                return { success: false, error: "Parent access is blocked by Firestore rules. This flow needs a dedicated public-safe lookup path." };
            }
            return { success: false, error: error.message };
        }
    };


    useEffect(() => {
        let unsubscribeData = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                
                // Real-time listener: This automatically updates userData across the app
                unsubscribeData = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData(docSnap.data());
                    } else {
                        console.log("👤 No user doc yet - will create on first action");
                    }
                    setLoading(false);
                }, (err) => {
                    if (err.code === 'permission-denied') {
                        console.warn("Firestore: Missing permissions for user doc. Update rules in Firebase Console (project ai-tutor-b89dd).");
                    } else {
                        console.error("Firestore snapshot error:", err);
                    }
                    // CRITICAL: Always set loading false - prevents infinite spinner
                    setLoading(false);
                });
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeData) unsubscribeData();
        };
    }, []);

    const value = {
        currentUser,
        userData,
        loading,
        register,
        login,
        logout,
        googleLogin,
        setTheme: updateTheme,
        markChapterComplete,
        getProgress,
        generateParentCode,
        verifyParentCode
    };


    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
