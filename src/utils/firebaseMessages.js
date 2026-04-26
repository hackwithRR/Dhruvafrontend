import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, where, serverTimestamp } from "firebase/firestore";

/**
 * Saves a message to the user's specific history.
 * Uses serverTimestamp to prevent issues with local device time sync.
 */
export const saveMessage = async (userId, messageData) => {
  try {
    await addDoc(collection(db, "messages"), {
      ...messageData,
      userId, // Critical: Tag the message with the owner's ID
      timestamp: serverTimestamp(), // Use Firestore server time
    });
  } catch (error) {
    console.error("Error saving message node:", error);
    throw error;
  }
};

/**
 * Fetches only the messages belonging to the authorized user.
 */
export const fetchMessages = async (userId) => {
  try {
    const q = query(
      collection(db, "messages"),
      where("userId", "==", userId), // Security: Only get YOUR messages
      orderBy("timestamp", "asc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error retrieving message nodes:", error);
    return []; // Return empty array to prevent app crashes
  }
};