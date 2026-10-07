declare module "react-signature-canvas" {
  import * as React from "react";
  export default class SignatureCanvas extends React.Component<{ canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>; onEnd?: () => void; penColor?: string }> {
    clear(): void;
    isEmpty(): boolean;
    toDataURL(type?: string): string;
  }
}
