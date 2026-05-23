// src/components/ChatBubble.jsx
export default function ChatBubble({ message, currentUser }) {
    const isUser = message.role === "user";
    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-2 rounded-lg max-w-xs ${isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}>
                {message.content}
            </div>
        </div>
    );
}