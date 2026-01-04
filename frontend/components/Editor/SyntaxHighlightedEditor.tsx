'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { ValidationError } from '@/types/validation';

interface SyntaxHighlightedEditorProps {
  value: string;
  onChange: (value: string) => void;
  errors?: ValidationError[];
  placeholder?: string;
}

export default function SyntaxHighlightedEditor({
  value,
  onChange,
  errors = [],
  placeholder,
}: SyntaxHighlightedEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);

  // Synchronize scroll between textarea and highlight layer
  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollTop, scrollLeft]);

  // Generate highlighted text with error underlines
  const getHighlightedText = () => {
    if (errors.length === 0) {
      return value || ' '; // Space ensures the div has height
    }

    const lines = value.split('\n');
    const errorMap = new Map<number, ValidationError[]>();

    // Group errors by line number
    errors.forEach((error) => {
      const lineErrors = errorMap.get(error.line) || [];
      lineErrors.push(error);
      errorMap.set(error.line, lineErrors);
    });

    // Build the highlighted HTML
    return lines
      .map((lineText, index) => {
        const lineNumber = index + 1;
        const lineErrors = errorMap.get(lineNumber);

        if (!lineErrors || lineErrors.length === 0) {
          return escapeHtml(lineText) || ' ';
        }

        // Sort errors by column to handle overlapping errors
        const sortedErrors = [...lineErrors].sort((a, b) => a.column - b.column);

        let result = '';
        let lastIndex = 0;

        sortedErrors.forEach((error) => {
          const startCol = error.column;
          const endCol = startCol + error.length;

          // Add text before error
          result += escapeHtml(lineText.substring(lastIndex, startCol));

          // Add error text with underline
          const errorText = lineText.substring(startCol, endCol);
          result += `<span class="error-underline">${escapeHtml(errorText)}</span>`;

          lastIndex = endCol;
        });

        // Add remaining text after last error
        result += escapeHtml(lineText.substring(lastIndex));

        return result || ' ';
      })
      .join('\n');
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        zIndex: 0,
        backgroundColor: '#1f2937',
      }}
    >
      {/* Background highlight layer */}
      <div
        ref={highlightRef}
        className="absolute inset-0 p-4 font-mono text-sm pointer-events-none overflow-auto"
        style={{
          lineHeight: '1.6',
          tabSize: 2,
          color: 'transparent',
          userSelect: 'none',
          zIndex: 1,
          whiteSpace: 'pre',
          wordWrap: 'normal',
          overflowWrap: 'normal',
        }}
        dangerouslySetInnerHTML={{
          __html: getHighlightedText(),
        }}
      />

      {/* Textarea overlay */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        className="absolute inset-0 p-4 font-mono text-sm resize-none focus:outline-none placeholder-gray-500"
        style={{
          tabSize: 2,
          border: 'none',
          lineHeight: '1.6',
          background: 'transparent',
          color: '#ffffff',
          caretColor: '#f3f4f6',
          width: '100%',
          height: '100%',
          overflow: 'auto',
          zIndex: 2,
          whiteSpace: 'pre',
          wordWrap: 'normal',
        }}
        spellCheck={false}
      />

      {/* Error tooltip */}
      {errors.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-red-900/80 text-red-200 px-3 py-2 rounded text-sm max-w-md pointer-events-none">
          <div className="font-semibold mb-1">
            {errors.length} error{errors.length !== 1 ? 's' : ''}
          </div>
          <div className="text-xs space-y-1">
            {errors.slice(0, 3).map((err, i) => (
              <div key={i}>
                Line {err.line}: {err.message}
              </div>
            ))}
            {errors.length > 3 && (
              <div className="text-red-300">...and {errors.length - 3} more</div>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .error-underline {
            color: transparent !important;
            background-color: rgba(239, 68, 68, 0.2) !important;
            text-decoration: underline !important;
            text-decoration-color: #ef4444 !important;
            text-decoration-style: wavy !important;
            text-decoration-thickness: 2px !important;
            text-underline-offset: 2px !important;
          }
        `
      }} />
    </div>
  );
}
