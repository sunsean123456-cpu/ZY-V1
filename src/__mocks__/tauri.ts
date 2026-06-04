// Mock Tauri invoke for testing
export const invoke = jest.fn().mockResolvedValue({ success: true, data: [] });
export const emit = jest.fn();
export const listen = jest.fn();
