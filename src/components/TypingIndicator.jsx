import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

export default function TypingIndicator() {
    const { colors } = useTheme();

    return (
        <motion.div
            className={`inline-block px-4 py-2 rounded-2xl text-sm ${colors.bubbleAI}`}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
        >
            AI is thinking…
        </motion.div>
    );
}