module.exports = {
  testMatch: ['<rootDir>/tests/**/(*.)+(spec|test).[jt]s'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.[jt]s$': 'babel-jest',
  },
};
