// Browser-safe stubs for native modules
export const onnxruntime = {
  // Add any browser-compatible methods you need here
  InferenceSession: class {
    constructor() {
      throw new Error('ONNX Runtime is not supported in the browser');
    }
  },
};

export const tokenizers = {
  // Add any browser-compatible methods you need here
  Tokenizer: class {
    constructor() {
      throw new Error('Native tokenizers are not supported in the browser');
    }
  },
};
