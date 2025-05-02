import * as React from 'react';

declare module 'react-quill' {
  interface ReactQuillProps {
    ref?: React.Ref<ReactQuill>;
    value?: string;
    onChange?: (content: string) => void;
    modules?: any;
    formats?: string[];
    style?: React.CSSProperties;
  }
  class ReactQuill extends React.Component<ReactQuillProps> {}
  export default ReactQuill;
} 