export const save = jest.fn().mockResolvedValue('/tmp/test.json');
export const open = jest.fn().mockResolvedValue('/tmp/test.json');
export const message = jest.fn();
export const confirm = jest.fn().mockResolvedValue(true);
export const ask = jest.fn().mockResolvedValue(true);
