module.exports = {
  root: true,
  extends: ["@mizzle/eslint-config"],
  overrides: [
    {
      files: ["test/**/*.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
  ],
};
