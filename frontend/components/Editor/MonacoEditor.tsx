'use client';

import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { ValidationError } from '@/types/validation';
import { configureMonaco } from '@/services/monacoConfig';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  errors?: ValidationError[];
}

export default function MonacoEditor({ value, onChange, errors = [] }: MonacoEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<monaco.editor.ITextModel | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Configure Monaco workers
    configureMonaco();

    // Register the TripDSL language
    monaco.languages.register({ id: 'tripdsl' });

    // Set syntax highlighting
    monaco.languages.setMonarchTokensProvider('tripdsl', {
      tokenizer: {
        root: [
          [/\/\/.*$/, 'comment'],
          [/"[^"]*"/, 'string'],
          [/\b(trip|name|stops|from|to|tags|color)\b/, 'keyword'],
          [/[{}()\[\]]/, 'bracket'],
          [/[,=]/, 'delimiter'],
        ],
      },
    });

    // Define theme
    monaco.editor.defineTheme('tripdsl-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
      ],
      colors: {
        'editor.background': '#1f2937',
      },
    });

    // Create editor
    const editor = monaco.editor.create(containerRef.current, {
      value: value,
      language: 'tripdsl',
      theme: 'tripdsl-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      renderLineHighlight: 'line',
      scrollBeyondLastLine: false,
      wordWrap: 'off',
      tabSize: 2,
    });

    editorRef.current = editor;
    modelRef.current = editor.getModel();

    // Listen for content changes
    editor.onDidChangeModelContent(() => {
      onChange(editor.getValue());
    });

    return () => {
      editor.dispose();
    };
  }, []);

  // Update editor value when prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  // Update error markers
  useEffect(() => {
    if (!modelRef.current) return;

    const markers: monaco.editor.IMarkerData[] = errors.map((error) => ({
      severity: error.severity === 'error'
        ? monaco.MarkerSeverity.Error
        : monaco.MarkerSeverity.Warning,
      startLineNumber: error.line,
      startColumn: error.column + 1, // Monaco uses 1-based columns
      endLineNumber: error.line,
      endColumn: error.column + error.length + 1,
      message: error.message,
    }));

    monaco.editor.setModelMarkers(modelRef.current, 'tripdsl', markers);
  }, [errors]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  );
}
