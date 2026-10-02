"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateBusinessConfig } from "@/app/actions/business-config";
import { getContrastColor } from "@/lib/color";

type Config = {
  businessName: string;
  primaryColor: string;
  logoUrl: string | null;
  bookingLink: string | null;
  supportEmail: string | null;
};

export function SettingsForm({ config }: { config: Config }) {
  const [businessName, setBusinessName] = useState(config.businessName);
  const [color, setColor] = useState(config.primaryColor);
  const [logoUrl, setLogoUrl] = useState(config.logoUrl ?? "");
  const [bookingLink, setBookingLink] = useState(config.bookingLink ?? "");
  const [supportEmail, setSupportEmail] = useState(config.supportEmail ?? "");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateBusinessConfig(formData);
      toast.success("Business settings saved");
    });
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Business Profile</CardTitle>
        <CardDescription>
          These values drive the branding across the whole app — sidebar, page titles, and
          anywhere your business name or color shows up.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business name</Label>
            <Input
              id="businessName"
              name="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent p-1"
                aria-label="Pick primary color"
              />
              <Input
                id="primaryColor"
                name="primaryColor"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="font-mono"
              />
              <span
                className="rounded-md px-3 py-1.5 text-xs font-medium"
                style={{ backgroundColor: color, color: getContrastColor(color) }}
              >
                Preview
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL (optional)</Label>
            <Input
              id="logoUrl"
              name="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookingLink">Booking link</Label>
            <Input
              id="bookingLink"
              name="bookingLink"
              value={bookingLink}
              onChange={(e) => setBookingLink(e.target.value)}
              placeholder="https://cal.com/your-business"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support email</Label>
            <Input
              id="supportEmail"
              name="supportEmail"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="hello@yourbusiness.com"
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
