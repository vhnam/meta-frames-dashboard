import * as v from "valibot";

const email = v.pipe(
  v.string("Email is required."),
  v.trim(),
  v.nonEmpty("Email is required."),
  v.email("Enter a valid email address."),
  v.maxLength(254, "Email is too long."),
);

/** The API's rule: 8+ characters with upper case, lower case, a digit and a symbol. */
const newPassword = v.pipe(
  v.string("Password is required."),
  v.minLength(8, "Use at least 8 characters."),
  v.maxLength(72, "Use at most 72 characters."),
  v.regex(/[A-Z]/, "Add an upper-case letter."),
  v.regex(/[a-z]/, "Add a lower-case letter."),
  v.regex(/\d/, "Add a digit."),
  v.regex(/[^A-Za-z0-9]/, "Add a symbol."),
);

export const PASSWORD_HINT =
  "At least 8 characters with upper and lower case, a digit and a symbol.";

export const LoginSchema = v.object({
  email,
  password: v.pipe(v.string("Password is required."), v.nonEmpty("Password is required.")),
});

export const RegisterSchema = v.pipe(
  v.object({
    name: v.pipe(v.string(), v.trim(), v.maxLength(100, "Use at most 100 characters.")),
    email,
    password: newPassword,
    confirmPassword: v.string(),
  }),
  v.forward(
    v.partialCheck(
      [["password"], ["confirmPassword"]],
      (i) => i.password === i.confirmPassword,
      "Passwords do not match.",
    ),
    ["confirmPassword"],
  ),
);

export const RecoverSchema = v.object({ email });

export const ResetPasswordSchema = v.pipe(
  v.object({ password: newPassword, confirmPassword: v.string() }),
  v.forward(
    v.partialCheck(
      [["password"], ["confirmPassword"]],
      (i) => i.password === i.confirmPassword,
      "Passwords do not match.",
    ),
    ["confirmPassword"],
  ),
);
