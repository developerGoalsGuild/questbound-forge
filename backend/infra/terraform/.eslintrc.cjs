module.exports = {
  root: false,
  overrides: [
    {
      files: ['resolvers/**/*.js'],
      excludedFiles: ['resolvers/__tests__/**', 'lambdas/**'],
      plugins: ['@aws-appsync'],
      extends: ['plugin:@aws-appsync/recommended'],
      parser: require.resolve('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
        extraFileExtensions: ['.mjs']
      },
      rules: {
        // Relax rules that are too strict or not applicable to our resolvers/tests
        '@aws-appsync/no-regex': 'off',
        '@aws-appsync/no-try': 'off',
        '@aws-appsync/no-for': 'off',
        '@aws-appsync/no-disallowed-unary-operators': 'off',
        '@aws-appsync/no-disallowed-methods': 'off',
        '@aws-appsync/no-recursion': 'off'
      }
    }
  ]
};
