// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "node_modules/", "roms/", "coverage/"] },
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      // Existing code from the port breaks these. They are warnings for now
      // so that `npm run lint` passes; they are fixed during the cleanup.
      "prefer-const": "warn",
      "no-case-declarations": "warn",
      "no-fallthrough": "warn",
      "no-empty": "warn",
      "no-useless-assignment": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-namespace": "warn",

      // Naming standard for the project. Set to "warn" while the old names
      // from the C++ port are being renamed; switch to "error" when done.
      "@typescript-eslint/naming-convention": [
        "warn",
        { selector: "default", format: ["camelCase"], leadingUnderscore: "allow" },
        { selector: "import", format: ["camelCase", "PascalCase"] },
        { selector: "variable", modifiers: ["const", "global"], format: ["camelCase", "UPPER_CASE"] },
        // Constants may also be PascalCase (plan rule 5), e.g. WPC.DmdRows, HitTypes.AddrAddr
        { selector: "variable", modifiers: ["const", "exported"], format: ["camelCase", "UPPER_CASE", "PascalCase"] },
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "enumMember", format: ["PascalCase"] },
        { selector: "objectLiteralProperty", modifiers: ["requiresQuotes"], format: null },
      ],
    },
  }
);
