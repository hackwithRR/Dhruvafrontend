/**
 * AntharikshAI - Mindmap Prompting Logic
 * Enhanced with LaTeX math support for formulas
 */

/**
 * Generates a system prompt for AI mindmap creation
 * Includes instructions for Unicode math symbols instead of LaTeX
 */
export const generateMindmapPrompt = (board, classLevel, subject, chapter) => {
  return `Create a Mermaid mindmap for ${chapter} (${subject}, ${board} Class ${classLevel}).

OUTPUT FORMAT - Use this exact structure:
\`\`\`mermaid
mindmap
  root(((${chapter})))
    (Introduction)
      [Definition]
      [Importance]
    (Main Concepts)
      [Concept 1]
      [Concept 2]
    (Applications)
      [Example 1]
      [Example 2]
    (Summary)
      [Key Points]
\`\`\`

RULES:
1. Start with "mindmap" on its own line
2. Use 2 spaces for each indentation level
3. Root: (((${chapter}))) - triple parentheses
4. Topics: (Topic Name) - single parentheses
5. Sub-points: [Sub Point] - square brackets
6. No special characters: " ' : ; | & < >

MATH FORMATTING - Use Unicode symbols instead of LaTeX:
- Fractions: Use "a/b" or "÷" instead of \\frac{a}{b}
- Exponents: Use "x²" "x³" "x^n" instead of x^2 or x^{n}
- Square roots: Use "√x" or "√(expression)" instead of \\sqrt{x}
- Pi: Use "π" instead of \\pi
- Infinity: Use "∞" instead of \\infty
- Greek letters: Use α β γ θ Δ Σ directly
- Subscripts: Use "x₁" "x₂" instead of x_1 x_2
- Multiplication: Use "×" or "·" instead of \\times
- Plus/minus: Use "±" instead of \\pm
- Arrows: Use "→" "⇒" instead of \\rightarrow

EXAMPLE MATH EXPRESSIONS:
- "Area of circle: A = πr²"
- "Quadratic formula: x = (-b ± √(b²-4ac))/2a"
- "Pythagoras: a² + b² = c²"
- "Trigonometry: sin²θ + cos²θ = 1"
- "Exponent rules: a^m × a^n = a^(m+n)"

OUTPUT ONLY the mermaid code block. No explanations.`.trim();
};

/**
 * Extracts mindmap from AI response
 */
export const extractMindmap = (response) => {
  if (!response) return null;
  
  // Find mermaid code block
  const match = response.match(/```mermaid\s*([\s\S]*?)\s*```/);
  if (!match) return null;
  
  return match[1].trim();
};

/**
 * Sanitizes mindmap code and converts LaTeX to Unicode
 */
export const sanitizeMindmap = (code) => {
  if (!code) return null;
  
  let sanitized = code;

  // Fix common errors
  sanitized = sanitized.replace(/mindmap\s+root\(\(\(/g, 'mindmap\n  root(((');
  sanitized = sanitized.replace(/,\s*/g, ' ');
  
  // Convert common LaTeX to Unicode
  sanitized = sanitized.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2');
  sanitized = sanitized.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  sanitized = sanitized.replace(/\\sqrt/g, '√');
  sanitized = sanitized.replace(/\\pi/g, 'π');
  sanitized = sanitized.replace(/\\infty/g, '∞');
  sanitized = sanitized.replace(/\\alpha/g, 'α');
  sanitized = sanitized.replace(/\\beta/g, 'β');
  sanitized = sanitized.replace(/\\gamma/g, 'γ');
  sanitized = sanitized.replace(/\\theta/g, 'θ');
  sanitized = sanitized.replace(/\\Delta/g, 'Δ');
  sanitized = sanitized.replace(/\\Sigma/g, 'Σ');
  sanitized = sanitized.replace(/\\pm/g, '±');
  sanitized = sanitized.replace(/\\times/g, '×');
  sanitized = sanitized.replace(/\\cdot/g, '·');
  sanitized = sanitized.replace(/\\rightarrow/g, '→');
  sanitized = sanitized.replace(/\\Rightarrow/g, '⇒');
  sanitized = sanitized.replace(/\\left/g, '');
  sanitized = sanitized.replace(/\\right/g, '');
  sanitized = sanitized.replace(/\\,/g, ' ');
  
  // Remove remaining LaTeX commands
  sanitized = sanitized.replace(/\\[a-zA-Z]+/g, '');
  sanitized = sanitized.replace(/[{}]/g, '');
  
  // Remove other problematic characters
  sanitized = sanitized.replace(/["':;|&<>]/g, '');
  
  // Ensure proper closing
  const openParens = (sanitized.match(/\(/g) || []).length;
  const closeParens = (sanitized.match(/\)/g) || []).length;
  if (openParens > closeParens) {
    sanitized += ')'.repeat(openParens - closeParens);
  }
  
  const openBrackets = (sanitized.match(/\[/g) || []).length;
  const closeBrackets = (sanitized.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) {
    sanitized += ']'.repeat(openBrackets - closeBrackets);
  }

  return sanitized.trim();
};

/**
 * Generates a fallback mindmap when AI fails
 */
export const generateFallbackMindmap = (chapter, subject) => {
  // Build mindmap with explicit newlines
  const lines = [
    'mindmap',
    '  root(((' + chapter + ')))',
    '    (Introduction)',
    '      [Definition and basic concepts]',
    '      [Importance and applications]',
    '    (Main Concepts)',
    '      [Key concept 1 with formula if applicable]',
    '      [Key concept 2 with examples]',
    '      [Key concept 3 with properties]',
    '    (Formulas and Equations)',
    '      [Important formula 1]',
    '      [Important formula 2]',
    '    (Solved Examples)',
    '      [Example 1: Step by step solution]',
    '      [Example 2: Application problem]',
    '    (Summary)',
    '      [Key points to remember]',
    '      [Common mistakes to avoid]'
  ];
  
  // Use actual newline character
  return lines.join(String.fromCharCode(10));
};

export default {
  generateMindmapPrompt,
  extractMindmap,
  sanitizeMindmap,
  generateFallbackMindmap
};
