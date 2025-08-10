"use server"

type ContactState = {
  ok: boolean
  message: string
  errors: Record<string, string>
}

export async function submitContact(prevState: ContactState, formData: FormData): Promise<ContactState> {
  // Simulate processing
  await new Promise((r) => setTimeout(r, 700))

  const name = String(formData.get("name") || "").trim()
  const email = String(formData.get("email") || "").trim()
  const message = String(formData.get("message") || "").trim()

  const errors: Record<string, string> = {}
  if (!name) errors.name = "Please enter your name."
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.email = "Please enter a valid email."
  if (!message || message.length < 10) errors.message = "Please include a bit more detail."

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors }
  }

  // Here you could send an email, write to a DB, or call a webhook.

  return { ok: true, message: `Thanks, ${name}. I’ll be in touch soon.`, errors: {} }
}
