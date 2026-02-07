export default function ThemeSelector({ theme, setTheme }) {
    return (
        <select value={theme} onChange={e => setTheme(e.target.value)} className="border p-1 rounded">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="blue">Blue</option>
        </select>
    );
}