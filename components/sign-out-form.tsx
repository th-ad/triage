import Form from "next/form";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SignOutForm = () => {
  return (
    <Form
      action={async () => {
        "use server";

        const cookieStore = await cookies();
        cookieStore.delete("better-auth.session_token");
        redirect("/");
      }}
      className="w-full"
    >
      <button
        className="w-full px-1 py-0.5 text-left text-red-500"
        type="submit"
      >
        Sign out
      </button>
    </Form>
  );
};
