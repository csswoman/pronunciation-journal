"use client";

import React from "react";
import Button from "@/components/ui/Button";

export default function ThemedButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <Button onClick={onClick}>
      {children}
    </Button>
  );
}
