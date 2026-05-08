import React from 'react';

// Shared PYQ formatting utilities for:
// - LaTeX $$...$$ blocks + $...$ inline
// - power/base formatting (^, _{...}) and log patterns
// - bold + highlight of important words/terms
// - bulleting + spacing using // as newline marker

export function renderInline(text, { primaryColor = '#6366f1' } = {}) {
  if (!text) return null;

  const normalized = String(text).replace(/\\n/g, '\n');

  // Split into $$...$$ blocks, and other content segments
  const parts = normalized.split(/(\[BOLD\][\s\S]*?\[\/BOLD\]|\$\$[\s\S]*?\$\$)/g);

  return parts
    .map((part, i) => {
      if (!part) return null;

      // Keep $$...$$ blocks as a dedicated visual block
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2).trim();
        return (
          <div key={i} className="my-3 px-2">
            <span
              style={{
                backgroundColor: primaryColor + '15',
                color: primaryColor,
                border: `1px solid ${primaryColor}40`,
                borderRadius: 10,
                padding: '8px 12px',
                display: 'inline-block',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 13
              }}
            >
              {`$$${formula}$$`}
            </span>
          </div>
        );
      }

      // [BOLD]...[/BOLD]
      if (part.includes('[BOLD]') && part.includes('[/BOLD]')) {
        const content = part.replace('[BOLD]', '').replace('[/BOLD]', '');
        return (
          <strong
            key={i}
            style={{ color: primaryColor, fontWeight: 800 }}
            className="text-lg px-1"
          >
            {content}
          </strong>
        );
      }

      // Default segment: apply inline transformations and return as HTML
      let processed = part;

      // [HIGHLIGHT]...[/HIGHLIGHT]
      processed = processed.replace(
        /\[HIGHLIGHT\]([\s\S]*?)\[\/HIGHLIGHT\]/gi,
        (_m, content) => {
          const safe = String(content).replace(/</g, '<').replace(/>/g, '>');
          return `<span style="background-color:${primaryColor}22;color:${primaryColor};border:1px solid ${primaryColor}40;padding:2px 6px;border-radius:10px;font-weight:800;display:inline-block;">${safe}</span>`;
        }
      );

      // ==text== highlight variant
      processed = processed.replace(/==([^=]+)==/g, (_m, content) => {
        const safe = String(content).replace(/</g, '<').replace(/>/g, '>');
        return `<span style="background-color:${primaryColor}22;color:${primaryColor};border:1px solid ${primaryColor}40;padding:2px 6px;border-radius:10px;font-weight:800;display:inline-block;">${safe}</span>`;
      });

      // **bold**
      processed = processed.replace(
        /\*\*(.*?)\*\*/g,
        `<strong style="color:${primaryColor};font-weight:800;">$1</strong>`
      );

      // Inline $...$ => chip
      processed = processed.replace(/\$([^$]+)\$/g, (_m, expr) => {
        const safeExpr = String(expr).trim().replace(/[<>]/g, '');
        return `<span style="background-color:${primaryColor}14;color:${primaryColor};border:1px solid ${primaryColor}30;padding:2px 6px;border-radius:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,\"Liberation Mono\",\"Courier New\",monospace;font-size:12px;display:inline-block;">$${safeExpr}$</span>`;
      });

      // Power formatting: base^exp -> <sup>
      processed = processed.replace(/(\w+|\([^\)]+\))\^(\d+)/g, (m, base, exp) => {
        const safeExp = String(exp).replace(/[^0-9]/g, '');
        let safeBase = String(base || '').replace(/[<>]/g, '');
        if (safeBase.startsWith('(') && safeBase.endsWith(')')) safeBase = safeBase.slice(1, -1);
        return `${safeBase}<sup>${safeExp}</sup>`;
      });

      // Subscript formatting: x_{y} -> <sub>
      processed = processed.replace(/(\w+)\_\{(\w+)\}/g, (_m, base, sub) => {
        const safeBase = String(base).replace(/[<>]/g, '');
        const safeSub = String(sub).replace(/[^a-zA-Z0-9]/g, '');
        return `${safeBase}<sub>${safeSub}</sub>`;
      });

      // log_{2}(x) -> log<sub>2</sub>(x)
      processed = processed.replace(
        /log\_\{(\d+)\}\(([^)]+)\)/gi,
        (_m, sub, arg) => {
          const safeSub = String(sub).replace(/[^0-9]/g, '');
          const safeArg = String(arg).replace(/[<>]/g, '');
          return `log<sub>${safeSub}</sub>(${safeArg})`;
        }
      );

      // log_2 x -> log<sub>2</sub>x
      processed = processed.replace(/log\_(\d+)\s*([a-zA-Z0-9\)\(]+)/gi, (_m, sub, arg) => {
        const safeSub = String(sub).replace(/[^0-9]/g, '');
        const safeArg = String(arg).replace(/[<>]/g, '');
        return `log<sub>${safeSub}</sub>${safeArg}`;
      });

      // Keyword/important-term highlighting
      const keyTerms = [
        'Definition:',
        'Formula:',
        'Therefore:',
        'Hence:',
        'Proof:',
        'Example:',
        'Solution:',
        'Important:',
        'Key Points:',
        'Remember:',
        'Step',
        'Summary:',
        'Conclusion:',
        'Power',
        'Base'
      ];

      keyTerms.forEach((term) => {
        const regex = new RegExp(`(${term})`, 'gi');
        processed = processed.replace(
          regex,
          `<strong style="color:${primaryColor};font-weight:800;">$1</strong>`
        );
      });

      return <span key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
    })
    .filter(Boolean);
}

export function renderFormattedAnswer(text, { primaryColor = '#6366f1' } = {}) {
  if (!text) return <div>Detailed solution loading...</div>;

  // Replace // with real newlines (backend uses // as newline marker)
  const normalized = String(text).replace(/\/\//g, '\n');
  const lines = normalized.split('\n');

  const elements = [];
  let currentList = [];
  let listKey = null;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <div key={listKey} className="my-4 space-y-3">
          {currentList}
        </div>
      );
      currentList = [];
      listKey = null;
    }
  };

  const processInline = (t) => {
    // renderInline returns array of elements; wrap it in a span-like container via fragments
    return renderInline(t, { primaryColor });
  };

  lines.forEach((line, lineIndex) => {
    if (!line.trim()) {
      flushList();
      elements.push(<div key={`space-${lineIndex}`} className="h-4" />);
      return;
    }

    const trimmedLine = line.trim();

    // Bullet line
    const bulletMatch = trimmedLine.match(/^[\*\-\u2022]\s*(.+)/);
    if (bulletMatch) {
      const content = bulletMatch[1];
      const processedContent = processInline(content);

      if (!listKey) listKey = `list-${lineIndex}`;

      currentList.push(
        <div key={lineIndex} className="flex items-start gap-3 group">
          <span
            className="mt-2.5 w-2 h-2 rounded-full flex-shrink-0 shadow-lg"
            style={{ backgroundColor: primaryColor, boxShadow: `0 0 8px ${primaryColor}60` }}
          ></span>
          <span className="leading-relaxed text-base">{processedContent}</span>
        </div>
      );
      return;
    }

    flushList();

    // Heading-like lines
    const headingMatch = trimmedLine.match(
      /^(Step \d+|Explanation|Given|To Find|Proof|Solution|Working|Note|Remember|Key Points|Important|Summary|Conclusion):?/i
    );

    if (headingMatch) {
      elements.push(
        <div key={lineIndex} className="mt-6 mb-3">
          <h5
            className="font-black text-lg tracking-wide flex items-center gap-2"
            style={{ color: primaryColor }}
          >
            <span className="w-1 h-6 rounded-full" style={{ backgroundColor: primaryColor }} />
            {processInline(trimmedLine)}
          </h5>
        </div>
      );
      return;
    }

    // Numbered lines (e.g., 1. ..., 2. ...)
    const numberMatch = trimmedLine.match(/^(\d+)\.\s*(.+)/);
    if (numberMatch) {
      const num = numberMatch[1];
      const content = numberMatch[2];
      const processedContent = processInline(content);

      elements.push(
        <div key={lineIndex} className="flex items-start gap-3 my-2">
          <span
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black text-white shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            {num}
          </span>
          <span className="leading-relaxed text-base pt-0.5">{processedContent}</span>
        </div>
      );
      return;
    }

    // Regular paragraph line
    elements.push(
      <p key={lineIndex} className="leading-relaxed my-2 text-base">
        {processInline(trimmedLine)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-0">{elements}</div>;
}

