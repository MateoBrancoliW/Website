"use client"

import { useActionState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { submitContact } from "@/app/actions/contact"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const initial = { ok: false as boolean, message: "", errors: {} as Record<string, string> }

export function ContactDialog({ open, onOpenChange }: Props) {
  const [state, formAction, pending] = useActionState(submitContact, initial)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Contact</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4" aria-describedby="contact-desc">
          <p id="contact-desc" className="text-sm text-muted-foreground">
            Share some details and I’ll get back to you.
          </p>

          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Your name" aria-invalid={!!state.errors.name} />
            {state.errors.name ? <p className="text-xs text-red-600">{state.errors.name}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              aria-invalid={!!state.errors.email}
            />
            {state.errors.email ? <p className="text-xs text-red-600">{state.errors.email}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="What would you like to make?"
              rows={5}
              aria-invalid={!!state.errors.message}
            />
            {state.errors.message ? <p className="text-xs text-red-600">{state.errors.message}</p> : null}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              {state.message ? (
                <span className={state.ok ? "text-green-700" : "text-red-700"}>{state.message}</span>
              ) : (
                <span className="text-muted-foreground">
                  {pending ? "Sending..." : "I usually reply within a day."}
                </span>
              )}
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Sending..." : "Send"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
