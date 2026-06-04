export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '^@tauri-apps/api/core$': '<rootDir>/src/__mocks__/tauri.ts',
    '^@tauri-apps/plugin-dialog$': '<rootDir>/src/__mocks__/tauri-dialog.ts',
    '^@tauri-apps/plugin-fs$': '<rootDir>/src/__mocks__/tauri-fs.ts',
  },
  setupFilesAfterFramework: ['<rootDir>/src/__tests__/setup.ts'],
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts', '<rootDir>/src/__tests__/**/*.test.tsx'],
};
