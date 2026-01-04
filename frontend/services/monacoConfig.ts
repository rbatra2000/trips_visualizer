import * as monaco from 'monaco-editor';

// Configure Monaco Editor for browser usage
export function configureMonaco() {
  // Self-host Monaco Editor workers
  (self as any).MonacoEnvironment = {
    getWorker(_: any, label: string) {
      return new Worker(
        new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url),
        { type: 'module' }
      );
    },
  };
}
