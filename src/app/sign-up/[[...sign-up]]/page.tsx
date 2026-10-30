import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#2E9494",
            colorText: "inherit",
            borderRadius: "0.25rem",
          },
          elements: {
            card: {
              border: "2px solid #2A2D2D",
              boxShadow: "0 5px 0 0 #2A2D2D",
              borderRadius: "0.25rem",
            },
            socialButtonsBlockButton: {
              border: "2px solid #2A2D2D",
              borderRadius: "0.25rem",
              fontWeight: "700",
            },
            formButtonPrimary: {
              borderRadius: "0.25rem",
              fontWeight: "700",
              boxShadow: "0 3px 0 0 #2A2D2D",
            },
          },
        }}
      />
    </div>
  );
}
